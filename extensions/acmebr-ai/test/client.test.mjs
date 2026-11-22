/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { ChatClientError, completionUrl, streamChat } from '../src/client.ts';

function cancellation() {
	const listeners = new Set();
	return {
		isCancellationRequested: false,
		onCancellationRequested(listener) { listeners.add(listener); return { dispose: () => listeners.delete(listener) }; },
		cancel() { this.isCancellationRequested = true; for (const listener of listeners) { listener(); } },
		get listenerCount() { return listeners.size; },
	};
}

async function server(t, handler) {
	const instance = createServer(handler);
	await new Promise(resolve => instance.listen(0, '127.0.0.1', resolve));
	t.after(async () => {
		instance.closeAllConnections();
		await new Promise((resolve, reject) => instance.close(error => error ? reject(error) : resolve()));
	});
	return `http://127.0.0.1:${instance.address().port}/v1`;
}

function options(baseUrl, extra = {}) {
	return { baseUrl, model: 'test-model', apiKey: 'test-only-key', timeoutMs: 3000, ...extra };
}

async function collect(settings, token = cancellation()) {
	const chunks = [];
	for await (const text of streamChat(settings, [{ role: 'user', content: 'hello' }], token)) {
		chunks.push(text);
	}
	return chunks;
}

function event(text) {
	return `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: text } }] })}\r\n\r\n`;
}

test('normalizes API prefixes and rejects unsafe destinations', () => {
	assert.deepEqual([
		completionUrl('https://example.com/v1/').href,
		completionUrl('http://[::1]:1234/v1').href,
		...['http://example.com/v1', 'ftp://localhost/v1', 'https://user:pass@example.com/v1', 'https://example.com/v1?key=secret', 'https://example.com/v1#fragment', 'invalid'].map(value => {
			try { completionUrl(value); return 'accepted'; } catch (error) { return error.code; }
		}),
	], ['https://example.com/v1/chat/completions', 'http://[::1]:1234/v1/chat/completions', ...Array(6).fill('configuration')]);
});

test('streams split UTF-8 and SSE frames, preserves the request, and disposes cancellation', async t => {
	let received;
	const baseUrl = await server(t, (request, response) => {
		let body = '';
		request.on('data', chunk => { body += chunk; });
		request.on('end', () => {
			received = { path: request.url, key: request.headers.authorization, body: JSON.parse(body) };
			response.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8' });
			const bytes = Buffer.from(`: keepalive\r\n\r\n${event('Olá 🌎')}${event('!')}data: {"choices":[]}\n\ndata: [DONE]\n\n`);
			const split = bytes.indexOf(Buffer.from('🌎')) + 2;
			response.write(bytes.subarray(0, split));
			setImmediate(() => response.end(bytes.subarray(split)));
		});
	});
	const token = cancellation();
	const chunks = await collect(options(baseUrl), token);
	assert.deepEqual({ chunks, received, listeners: token.listenerCount }, {
		chunks: ['Olá 🌎', '!'], listeners: 0,
		received: { path: '/v1/chat/completions', key: 'Bearer test-only-key', body: { model: 'test-model', messages: [{ role: 'user', content: 'hello' }], stream: true } },
	});
});

test('cancels during response body consumption and releases listeners', async t => {
	const baseUrl = await server(t, (_request, response) => {
		response.writeHead(200, { 'content-type': 'text/event-stream' });
		response.write(event('partial'));
	});
	const token = cancellation();
	const iterator = streamChat(options(baseUrl), [{ role: 'user', content: 'hello' }], token);
	await iterator.next();
	const pending = iterator.next();
	token.cancel();
	await assert.rejects(pending, error => error instanceof ChatClientError && error.code === 'cancelled');
	assert.equal(token.listenerCount, 0);
});

test('pre-cancelled requests do not reach the server', async t => {
	let calls = 0;
	const baseUrl = await server(t, (_request, response) => { calls++; response.end(); });
	const token = cancellation();
	token.cancel();
	await assert.rejects(collect(options(baseUrl), token), { code: 'cancelled' });
	assert.deepEqual({ calls, listeners: token.listenerCount }, { calls: 0, listeners: 0 });
});

test('timeout includes the body stream', async t => {
	const baseUrl = await server(t, (_request, response) => {
		response.writeHead(200, { 'content-type': 'text/event-stream' });
		response.flushHeaders();
	});
	await assert.rejects(collect(options(baseUrl, { timeoutMs: 100 })), { code: 'timeout' });
});

test('HTTP errors expose status without echoing sensitive provider bodies', async t => {
	const baseUrl = await server(t, (_request, response) => { response.writeHead(401); response.end('test-only-key and sensitive prompt'); });
	await assert.rejects(collect(options(baseUrl)), error => error.code === 'http' && error.status === 401 && !error.message.includes('test-only-key'));
});

test('redirects do not forward credentials to another endpoint', async t => {
	let targetCalls = 0;
	const target = await server(t, (_request, response) => { targetCalls++; response.end(); });
	const baseUrl = await server(t, (_request, response) => { response.writeHead(307, { location: target }); response.end(); });
	await assert.rejects(collect(options(baseUrl)), { code: 'network' });
	assert.equal(targetCalls, 0);
});

test('truncated streams fail even after useful text', async t => {
	const baseUrl = await server(t, (_request, response) => {
		response.writeHead(200, { 'content-type': 'text/event-stream' });
		response.end(event('partial'));
	});
	await assert.rejects(collect(options(baseUrl)), { code: 'incomplete' });
});

test('malformed provider events and incorrect response formats fail', async t => {
	for (const body of ['data: invalid\n\n', 'data: null\n\n', 'data: {"error":{"message":"secret"}}\n\n']) {
		const baseUrl = await server(t, (_request, response) => { response.writeHead(200, { 'content-type': 'text/event-stream' }); response.end(body); });
		await assert.rejects(collect(options(baseUrl)), { code: 'protocol' });
	}
	const baseUrl = await server(t, (_request, response) => { response.writeHead(200, { 'content-type': 'application/json' }); response.end('{}'); });
	await assert.rejects(collect(options(baseUrl)), { code: 'protocol' });
});

test('output limits and tool requests are not reported as successful text completions', async t => {
	for (const [finish, code] of [['length', 'length'], ['content_filter', 'filtered'], ['tool_calls', 'unsupported']]) {
		const baseUrl = await server(t, (_request, response) => {
			response.writeHead(200, { 'content-type': 'text/event-stream' });
			response.end(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: finish }] })}\n\ndata: [DONE]\n\n`);
		});
		await assert.rejects(collect(options(baseUrl)), { code });
	}
});

test('breaking consumption closes the stream and releases cancellation subscriptions', async t => {
	const baseUrl = await server(t, (_request, response) => {
		response.writeHead(200, { 'content-type': 'text/event-stream' });
		response.write(event('first'));
	});
	const token = cancellation();
	for await (const _text of streamChat(options(baseUrl), [{ role: 'user', content: 'hello' }], token)) {
		break;
	}
	assert.equal(token.listenerCount, 0);
});

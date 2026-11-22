/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'node:assert/strict';
import { createRequire, Module } from 'node:module';
import { createServer } from 'node:http';
import { test } from 'node:test';

const require = createRequire(import.meta.url);

function harness(settings = {}, inputs = []) {
	const commands = new Map();
	const secrets = new Map();
	const handlers = new Map();
	const context = {
		subscriptions: [],
		secrets: { get: async key => secrets.get(key), store: async (key, value) => { secrets.set(key, value); }, delete: async key => { secrets.delete(key); } },
	};
	class ChatRequestTurn {
		constructor(prompt) { this.participant = 'acmebr.chat'; this.prompt = prompt; }
	}
	class ChatResponseMarkdownPart {
		constructor(value) { this.value = { value }; }
	}
	const api = {
		ChatRequestTurn, ChatResponseMarkdownPart, ConfigurationTarget: { Global: 1 },
		l10n: { t: (message, ...args) => message.replace(/\{(\d+)\}/g, (_, index) => args[index]) },
		commands: { registerCommand: (name, handler) => { commands.set(name, handler); return { dispose() { commands.delete(name); } }; } },
		chat: { createChatParticipant: (name, handler) => { handlers.set(name, handler); return { dispose() { handlers.delete(name); } }; } },
		window: { showInputBox: async () => inputs.shift(), showInformationMessage: async () => {}, showErrorMessage: async () => {} },
		workspace: { getConfiguration: () => ({ get: (key, fallback) => settings[key] ?? fallback, update: async (key, value, target) => { assert.equal(target, 1); settings[key] = value; } }) },
	};
	const original = Module._load;
	delete require.cache[require.resolve('../out/extension.js')];
	try {
		Module._load = function (id, ...args) { return id === 'vscode' ? api : original.call(this, id, ...args); };
		require('../out/extension.js').activate(context);
	} finally {
		Module._load = original;
	}
	return {
		api, settings, commands, secrets, context,
		async chat(prompt, history = [], references = []) {
			const chunks = [];
			const buttons = [];
			const result = await handlers.get('acmebr.chat')({ prompt, references }, { history }, { markdown: text => chunks.push(text), button: button => buttons.push(button) }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose() {} }) });
			return { chunks, buttons, result };
		},
	};
}

test('missing configuration offers the native configure command', async () => {
	const setup = harness();
	const response = await setup.chat('hello');
	assert.deepEqual({ chunks: response.chunks, command: response.buttons[0].command, subscriptions: setup.context.subscriptions.length }, { chunks: [], command: 'acmebr.ai.configure', subscriptions: 3 });
});

test('configuration stores the API key only in destination-bound SecretStorage', async () => {
	const setup = harness({}, ['http://127.0.0.1:1234/v1', 'local-model', 'private-key']);
	await setup.commands.get('acmebr.ai.configure')();
	assert.deepEqual({ settings: setup.settings, secrets: [...setup.secrets] }, {
		settings: { baseUrl: 'http://127.0.0.1:1234/v1', model: 'local-model' },
		secrets: [['acmebr.ai.apiKey:http://127.0.0.1:1234/v1/chat/completions', 'private-key']],
	});
	await setup.commands.get('acmebr.ai.removeApiKey')();
	assert.equal(setup.secrets.size, 0);
});

test('cancelling configuration leaves settings and secrets unchanged', async () => {
	const setup = harness({}, ['https://example.com/v1', 'model', undefined]);
	await setup.commands.get('acmebr.ai.configure')();
	assert.deepEqual({ settings: setup.settings, secrets: [...setup.secrets] }, { settings: {}, secrets: [] });
});

test('attachments are explicitly rejected before sending unsupported context', async () => {
	const setup = harness();
	const response = await setup.chat('describe this file', [], [{ id: 'file' }]);
	assert.match(response.result.errorDetails.message, /context is not available/);
});

test('native handler streams a real local response and omits failed history turns', async t => {
	let received;
	const server = createServer((request, response) => {
		let body = '';
		request.on('data', chunk => { body += chunk; });
		request.on('end', () => {
			received = JSON.parse(body);
			response.writeHead(200, { 'content-type': 'text/event-stream' });
			response.end('data: {"choices":[{"delta":{"content":"Olá"}}]}\n\ndata: [DONE]\n\n');
		});
	});
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
	t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
	const setup = harness({ baseUrl: `http://127.0.0.1:${server.address().port}/v1`, model: 'test-model' });
	const history = [
		new setup.api.ChatRequestTurn('previous'),
		{ participant: 'acmebr.chat', result: {}, response: [new setup.api.ChatResponseMarkdownPart('answer')] },
		new setup.api.ChatRequestTurn('failed'),
		{ participant: 'acmebr.chat', result: { errorDetails: { message: 'failure' } }, response: [] },
	];
	const result = await setup.chat('current', history);
	assert.deepEqual({ chunks: result.chunks, result: result.result, messages: received.messages }, {
		chunks: ['Olá'], result: {}, messages: [{ role: 'user', content: 'previous' }, { role: 'assistant', content: 'answer' }, { role: 'user', content: 'current' }],
	});
});

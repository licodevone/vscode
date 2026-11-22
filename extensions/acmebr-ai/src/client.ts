/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/** Cancellation contract shared structurally with the extension API. */
export interface ChatCancellationToken {
	readonly isCancellationRequested: boolean;
	onCancellationRequested(listener: () => void): { dispose(): void };
}

/** Text messages accepted by the initial Chat Completions adapter. */
export interface ChatMessage {
	readonly role: 'user' | 'assistant';
	readonly content: string;
}

/** Provider settings for one request; secrets are never logged. */
export interface ChatClientOptions {
	readonly baseUrl: string;
	readonly model: string;
	readonly apiKey?: string;
	readonly timeoutMs: number;
}

type ChatErrorCode = 'configuration' | 'cancelled' | 'timeout' | 'http' | 'network' | 'protocol' | 'incomplete' | 'length' | 'filtered' | 'unsupported';

/** Structured errors are localized at the UI boundary. */
export class ChatClientError extends Error {
	readonly code: ChatErrorCode;
	readonly status: number | undefined;

	constructor(code: ChatErrorCode, status?: number) {
		super(code);
		this.name = 'ChatClientError';
		this.code = code;
		this.status = status;
	}
}

interface CompletionChunk {
	choices?: { index?: number; delta?: { content?: string | null; refusal?: string | null; tool_calls?: object }; finish_reason?: string | null }[];
	error?: object;
}

/** Validate the provider destination before reading credentials or making requests. */
export function completionUrl(baseUrl: string): URL {
	let url: URL;
	try {
		url = new URL(baseUrl.trim());
	} catch {
		throw new ChatClientError('configuration');
	}
	const loopback = url.hostname === 'localhost' || url.hostname === '[::1]' || /^127\.\d+\.\d+\.\d+$/.test(url.hostname);
	if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) || url.username || url.password || url.search || url.hash) {
		throw new ChatClientError('configuration');
	}
	url.pathname = `${url.pathname.replace(/\/+$/, '')}/chat/completions`;
	return url;
}

/** Stream text while retaining cancellation through the complete response body. */
export async function* streamChat(options: ChatClientOptions, messages: readonly ChatMessage[], token: ChatCancellationToken): AsyncGenerator<string> {
	const url = completionUrl(options.baseUrl);
	if (!options.model.trim() || !Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0 || messages.length === 0) {
		throw new ChatClientError('configuration');
	}
	const controller = new AbortController();
	let timedOut = false;
	const subscription = token.onCancellationRequested(() => controller.abort());
	const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs);
	let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	try {
		if (token.isCancellationRequested) {
			controller.abort();
		}
		const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' };
		if (options.apiKey) {
			headers.Authorization = `Bearer ${options.apiKey}`;
		}
		const response = await fetch(url, {
			method: 'POST', headers, redirect: 'error', signal: controller.signal,
			body: JSON.stringify({ model: options.model.trim(), messages, stream: true }),
		});
		if (!response.ok) {
			await response.body?.cancel();
			throw new ChatClientError('http', response.status);
		}
		if (!response.body || !response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
			await response.body?.cancel();
			throw new ChatClientError('protocol');
		}
		reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8', { fatal: true });
		let buffer = '';
		let data: string[] = [];
		let eventSize = 0;
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) {
				throw new ChatClientError('incomplete');
			}
			buffer += decoder.decode(chunk.value, { stream: true });
			let newline: number;
			while ((newline = buffer.indexOf('\n')) !== -1) {
				if (controller.signal.aborted) {
					throw new ChatClientError('cancelled');
				}
				const line = buffer.slice(0, newline).replace(/\r$/, '');
				buffer = buffer.slice(newline + 1);
				eventSize += line.length;
				if (eventSize > 1024 * 1024) {
					throw new ChatClientError('protocol');
				}
				if (line.startsWith('data:')) {
					data.push(line.slice(5).replace(/^ /, ''));
				} else if (line === '') {
					const payload = data.join('\n');
					data = [];
					eventSize = 0;
					if (payload === '[DONE]') {
						return;
					}
					if (!payload) {
						continue;
					}
					let event: CompletionChunk;
					try {
						event = JSON.parse(payload);
					} catch {
						throw new ChatClientError('protocol');
					}
					if (!event || typeof event !== 'object' || event.error || !Array.isArray(event.choices)) {
						throw new ChatClientError('protocol');
					}
					for (const choice of event.choices) {
						if (!choice || typeof choice !== 'object') {
							throw new ChatClientError('protocol');
						}
						if (choice.index !== undefined && choice.index !== 0) {
							continue;
						}
						if (choice.delta?.tool_calls || choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call') {
							throw new ChatClientError('unsupported');
						}
						const text = choice.delta?.content ?? choice.delta?.refusal;
						if (text !== undefined && text !== null) {
							if (typeof text !== 'string') {
								throw new ChatClientError('protocol');
							}
							if (text) {
								yield text;
							}
						}
						if (choice.finish_reason === 'length' || choice.finish_reason === 'content_filter') {
							throw new ChatClientError(choice.finish_reason === 'length' ? 'length' : 'filtered');
						}
					}
				}
			}
			if (buffer.length + eventSize > 1024 * 1024) {
				throw new ChatClientError('protocol');
			}
		}
	} catch (error) {
		if (token.isCancellationRequested) {
			throw new ChatClientError('cancelled');
		}
		if (timedOut) {
			throw new ChatClientError('timeout');
		}
		if (error instanceof ChatClientError) {
			throw error;
		}
		throw new ChatClientError('network');
	} finally {
		clearTimeout(timer);
		subscription.dispose();
		controller.abort();
		try {
			await reader?.cancel();
		} catch {
			// Aborting the request can already have closed the response stream.
		}
		reader?.releaseLock();
	}
}

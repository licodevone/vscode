/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { ChatClientError, ChatMessage, completionUrl, streamChat } from './client';

const participantId = 'acmebr.chat';
const configureCommand = 'acmebr.ai.configure';

/** Bind a secret to its exact destination to avoid reusing it after endpoint changes. */
function secretId(baseUrl: string): string {
	return `acmebr.ai.apiKey:${completionUrl(baseUrl).href}`;
}

/** Show a localizable error without exposing provider response bodies or credentials. */
function errorMessage(error: Error): string {
	if (!(error instanceof ChatClientError)) {
		return vscode.l10n.t('The provider request failed. Check your configuration and connection.');
	}
	switch (error.code) {
		case 'configuration': return vscode.l10n.t('Configure a valid provider URL and model using ACME BR AI: Configure Provider.');
		case 'timeout': return vscode.l10n.t('The provider request timed out.');
		case 'http': return vscode.l10n.t('The provider returned HTTP {0}. Check your API key, model, and endpoint.', error.status ?? 0);
		case 'protocol': return vscode.l10n.t('The provider returned an invalid Chat Completions stream.');
		case 'incomplete': return vscode.l10n.t('The provider disconnected before completing the response. The text above may be incomplete.');
		case 'length': return vscode.l10n.t('The provider reached its output limit. The text above is incomplete.');
		case 'filtered': return vscode.l10n.t('The provider stopped the response because of its content policy.');
		case 'unsupported': return vscode.l10n.t('This chat currently supports text responses. Tool execution is not available yet.');
		case 'cancelled': return vscode.l10n.t('The request was cancelled.');
		case 'network': return vscode.l10n.t('Could not connect to the provider. Check the endpoint and your connection.');
	}
}

/** Configure the provider in application settings and store its key only in SecretStorage. */
async function configure(context: vscode.ExtensionContext): Promise<void> {
	const configuration = vscode.workspace.getConfiguration('acmebr.ai');
	const baseUrl = await vscode.window.showInputBox({
		title: vscode.l10n.t('ACME BR AI: Configure Provider'),
		prompt: vscode.l10n.t('Provider base URL, including its API prefix (for example, https://your-provider/v1)'),
		value: configuration.get<string>('baseUrl', ''), ignoreFocusOut: true,
		validateInput: value => {
			try { completionUrl(value); return undefined; } catch { return vscode.l10n.t('Use HTTPS, or HTTP for a loopback provider. Do not include credentials, query parameters, or fragments.'); }
		},
	});
	if (baseUrl === undefined) {
		return;
	}
	const model = await vscode.window.showInputBox({
		title: vscode.l10n.t('ACME BR AI: Model'), prompt: vscode.l10n.t('Model identifier supported by this provider'),
		value: configuration.get<string>('model', ''), ignoreFocusOut: true,
		validateInput: value => value.trim() ? undefined : vscode.l10n.t('Enter a model identifier.'),
	});
	if (model === undefined) {
		return;
	}
	const apiKey = await vscode.window.showInputBox({
		title: vscode.l10n.t('ACME BR AI: API Key'), password: true, ignoreFocusOut: true,
		prompt: vscode.l10n.t('API key for this endpoint. Leave blank to keep its stored key or use a provider without authentication.'),
	});
	if (apiKey === undefined) {
		return;
	}
	if (apiKey.trim()) {
		await context.secrets.store(secretId(baseUrl), apiKey.trim());
	}
	await configuration.update('baseUrl', baseUrl.trim(), vscode.ConfigurationTarget.Global);
	await configuration.update('model', model.trim(), vscode.ConfigurationTarget.Global);
	await vscode.window.showInformationMessage(vscode.l10n.t('Provider configured. Open Chat and send a message to @acmebr.'));
}

/** Register a native chat participant without depending on a Copilot model subscription. */
export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(vscode.commands.registerCommand(configureCommand, () => configure(context)));
	context.subscriptions.push(vscode.commands.registerCommand('acmebr.ai.removeApiKey', async () => {
		const baseUrl = vscode.workspace.getConfiguration('acmebr.ai').get<string>('baseUrl', '');
		try {
			await context.secrets.delete(secretId(baseUrl));
			await vscode.window.showInformationMessage(vscode.l10n.t('The API key for the configured endpoint was removed.'));
		} catch {
			await vscode.window.showErrorMessage(vscode.l10n.t('Configure a valid provider URL before removing its key.'));
		}
	}));
	context.subscriptions.push(vscode.chat.createChatParticipant(participantId, async (request, chatContext, response, token) => {
		try {
			if (token.isCancellationRequested) {
				return;
			}
			if (request.references.length > 0) {
				return { errorDetails: { message: vscode.l10n.t('File and selection context is not available in this first version. Send a text message directly to @acmebr.') } };
			}
			const configuration = vscode.workspace.getConfiguration('acmebr.ai');
			const baseUrl = configuration.get<string>('baseUrl', '');
			const model = configuration.get<string>('model', '');
			if (!baseUrl || !model) {
				response.button({ command: configureCommand, title: vscode.l10n.t('Configure Provider') });
				return { errorDetails: { message: vscode.l10n.t('Configure your provider before starting a conversation.') } };
			}
			const messages: ChatMessage[] = [];
			let pendingPrompt: string | undefined;
			for (const turn of chatContext.history) {
				if (turn.participant !== participantId) {
					continue;
				}
				if (turn instanceof vscode.ChatRequestTurn) {
					pendingPrompt = turn.prompt;
				} else if (!turn.result.errorDetails) {
					const text = turn.response.filter(part => part instanceof vscode.ChatResponseMarkdownPart).map(part => part.value.value).join('');
					if (text && pendingPrompt !== undefined) {
						messages.push({ role: 'user', content: pendingPrompt });
						messages.push({ role: 'assistant', content: text });
					}
					pendingPrompt = undefined;
				} else {
					pendingPrompt = undefined;
				}
			}
			messages.push({ role: 'user', content: request.prompt });
			while (messages.length > 1 && (messages.length > 21 || messages.reduce((size, message) => size + message.content.length, 0) > 60000)) {
				messages.shift();
			}
			while (messages[0]?.role === 'assistant') {
				messages.shift();
			}
			if (request.prompt.length > 60000) {
				return { errorDetails: { message: vscode.l10n.t('This message is too large. Send a shorter message.') } };
			}
			const apiKey = await context.secrets.get(secretId(baseUrl));
			for await (const text of streamChat({ baseUrl, model, apiKey, timeoutMs: configuration.get<number>('timeoutMs', 60000) }, messages, token)) {
				response.markdown(text);
			}
			return {};
		} catch (error) {
			if (token.isCancellationRequested) {
				return;
			}
			return { errorDetails: { message: errorMessage(error) } };
		}
	}));
}

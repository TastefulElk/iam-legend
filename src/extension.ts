// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';

import { match } from './match';
import { getActions, IamAction, IamService } from './iamActions';
import { createActionDocs, createActionsSummaryDocs, createServiceDocs } from './documentation';

let services: Record<string, IamService> = {};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.info('iam-legend extension activating');

	services = await getActions();

	registerHoverProviders();
	registerCompletionItemProviders();
}

const registerHoverProviders = () => {
	vscode.languages.registerHoverProvider({ language: 'yaml' }, hoverProvider);
	vscode.languages.registerHoverProvider({ language: 'json' }, hoverProvider);
};

const registerCompletionItemProviders = () => {
	vscode.languages.registerCompletionItemProvider({ language: 'yaml' }, completionItemProvider);
	vscode.languages.registerCompletionItemProvider({ language: 'json' }, completionItemProvider);
};

const normalize = (text: string) => text.replace(/^[^a-z0-9-:]/gi, ' ').trim();

const tryParseServiceFromText = (text: string): string | undefined => {
	let match = /([a-z0-9-]*)"?'?:/gi.exec(text);
	if (match) {
		return match[1];
	}
};

const completionItemProvider: vscode.CompletionItemProvider = {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
		if (!isInsideActionsArray(document, position)) {
			console.debug('outside actions array, not adding suggestions');
			return { items: [] };
		}
		console.debug('inside actions array, adding suggestions');
		const lineText = document.lineAt(position.line).text;
		const maybeServiceName = tryParseServiceFromText(lineText);
		
		const service = maybeServiceName && services[maybeServiceName];
		if (service) {
			const actionOffset = lineText.indexOf(`${service.servicePrefix}:`) + service.servicePrefix.length + 1;

			const suggestions: vscode.CompletionItem[] = service.actions.map(action => ({
				label: action.name,
				kind: CompletionItemKind.Field,
				data: action,
				documentation: createActionDocs(action),
				// Set explicit range as default behavior is to replace the whole current word.
				// that causes the service prefix to be overwritten with the action so we instead
				// set a range that starts from the current position instead
				range: new vscode.Range(position.line, actionOffset, position.line, position.character),
			}));

			return { items: suggestions };
		}

		const wordRange = document.getWordRangeAtPosition(position);
		const word = wordRange ? document.getText(wordRange) : '';

		const labelPrefix = word.startsWith('"')
			? '"' : word.startsWith(`'`)
				? `'` : '';

		const labelSuffix = word.endsWith('"')
			? '"' : word.endsWith(`'`)
				? `'` : '';
		
		try {
			const suggestions: vscode.CompletionItem[] = Object.values(services).map(service => ({
				label: `${labelPrefix}${service.servicePrefix}`,
				filterText: `${labelPrefix}${service.servicePrefix}${labelSuffix}`,
				kind: CompletionItemKind.Module,
				documentation: createServiceDocs(service),
				// Set explicit range as default behavior is to replace the whole current word.
				// that causes the service prefix to overwrite the action if already present
				// set a range that starts from the current position instead
				range: new vscode.Range(position.line, wordRange?.start.character as number || position.character, position.line, position.character),
			}));

			// preselect the first suggestion, since we likely have the most relevant suggestion here
			suggestions[0].preselect = true;

			return { items: suggestions };
		} catch (e) {
			console.error(e);
		}
	}
};

const isInsideActionsArray = (document: vscode.TextDocument, position: vscode.Position): boolean => {
	// if current line is actions/notActions field, we are inside the actions field
	const actionsFieldPattern = /^"?(not)?action"?:/i;
	let lineText = document.getText(new vscode.Range(position.line, 0, position.line, Number.MAX_VALUE)).toLowerCase();
	if (actionsFieldPattern.test(lineText)) {
		return true;
	}

	// if all previous lines start with '-' until we find a line that starts with 'actions/notActions', then we're also good
	let line = position.line;
	while (line > 0) {
		lineText = document.lineAt(line).text.trimStart().toLowerCase();

		if (actionsFieldPattern.test(lineText)) {
			return true;
		}

		if (/^["-]/.test(lineText)) {
			line--;
			continue;
		}

		return false;
	}

	return false;
};

const hoverProvider: vscode.HoverProvider = {
	provideHover(document, position) {
		const wordRange = document.getWordRangeAtPosition(position);

		const emptyResult = { contents: [] };
		if (!wordRange) { return emptyResult; }

		if (!isInsideActionsArray(document, position)) {
			return emptyResult;
		}

		const word = normalize(document.getText(wordRange));
		
		let [serviceName, action] = word.split(':');
		if (!services[serviceName]) {
			// if the hovered word doesn't include a known service, try with previous word
			action = serviceName;
			let serviceWordRange = document.getWordRangeAtPosition(new vscode.Position(
				position.line,
				wordRange.start.character - 2
			));
			serviceName = normalize(document.getText(serviceWordRange));
		}

		const service = services[serviceName];
		if (!service) {
			return emptyResult;
		}

		// if word matches 'service' but no action
		// return hover with documentation for that service
		if (service && !action) {
			return {
				contents: [createServiceDocs(service)],
			};
		}

		if (word.includes(':') && position.character < wordRange.start.character + serviceName.length + 1) {
			return {
				contents: [createServiceDocs(service)],
			};
		}

		// if matches 'service:action'
		// return hover with documentation for that action
		// if matches multiple actions, return hover with summary of actions
		const hoveredActions = service.actions.filter(x => match(action, x.name));
		if (!hoveredActions) { return emptyResult; }

		return {
			contents: hoveredActions.length === 0
				? ['No matching actions']
				: hoveredActions.length === 1
					? [createActionDocs(hoveredActions[0])]
					: [createActionsSummaryDocs(hoveredActions)]
		};
	}
};

// this method is called when your extension is deactivated
export function deactivate() { }

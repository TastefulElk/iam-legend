// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';

import { getActions, IamAction } from './iamActions';

let actions: Record<string, IamAction[]> = {};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.info('iam-legend extension activating');

	actions = await getActions();

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

const completionItemProvider: vscode.CompletionItemProvider = {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
		if (!isInsideActionsArray(document, position)) { 
			console.debug('outside actions array, not adding suggestions');
			return [];
		}
		console.debug('inside actions array, adding suggestions');
		
		const serviceKeys = Object.keys(actions);
		const lineText = document.lineAt(position.line).text;

		const service = serviceKeys.find(x => lineText.includes(`${x}:`));
		if (service) {
			const serviceActions = actions[service];
			const startIndex = lineText.indexOf(`${service}:`) + service.length + 1;
			const suggestions: vscode.CompletionItem[] = serviceActions.map(action => ({
				label: action.name,
				kind: CompletionItemKind.Field,
				data: action,
				documentation: new vscode.MarkdownString(formatActionDocumentation(action)),
				// Set explicit range as default behavior is to replace the whole current word.
				// that causes the service prefix to be overwritten with the action so we instead
				// set a range that starts from the current position instead
				range: new vscode.Range(position.line, startIndex, position.line, position.character),
			}));

			return { items: suggestions, isIncomplete: true };
		}

		const wordRange = document.getWordRangeAtPosition(position);
		const word = document.getText(wordRange);

		const labelPrefix = word.startsWith('"') 
			? '"' : word.startsWith(`'`) 
			? `'` : '';
		
			const labelSuffix = word.endsWith('"') 
			? '"' : word.endsWith(`'`) 
			? `'` : '';

		const suggestions: vscode.CompletionItem[] = serviceKeys.map(service => ({
			label: `${labelPrefix}${service}`,
			filterText: `${labelPrefix}${service}${labelSuffix}`,
			kind: CompletionItemKind.Module,
			documentation: new vscode.MarkdownString(formatServiceDocumentation(service, 'http://example.com')),
		}));

		return { items: suggestions, isIncomplete: true };
	}
};

const isInsideActionsArray = (document: vscode.TextDocument, position: vscode.Position): boolean => {
	// if current line includes 'actions:', we are in the actions array
	if (document.getText(new vscode.Range(position.line, 0, position.line, Number.MAX_VALUE)).includes('actions:')) {
		return true;
	}

	// if all previous lines start with '-' until we find a line that starts with 'actions:', then we're also good
	let line = position.line;
	while (line > 0) {
		const lineText = document.lineAt(line).text.trimStart().toLowerCase();

		if (/^"?action"?:/.test(lineText)) {
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
	provideHover(document, position, token) {
		const range = document.getWordRangeAtPosition(position);

		const emptyResult = { contents: [] };
		if (!range) { return emptyResult; }

		if (!isInsideActionsArray(document, position)) { 
			return emptyResult;
		}
		
		const word = document.getText(range);
		const trimmedWord = word.replace(/"/g, '').replace(/'/g, '').trim();

		let [service, action] = trimmedWord.split(':');
		if (!actions[service]) {
			// if the hovered word doesn't include a known service, try with previous word
			action = service;
			let serviceWordRange = document.getWordRangeAtPosition(new vscode.Position(
				position.line,
				range.start.character - 2
			));
			service = document.getText(serviceWordRange).replace(/"/g, '').replace(/'/g, '').trim();
		}

		// if word matches 'service' but no action
		// return hover with documentation for that service
		if (actions[service] && !action) {
			return {
				contents: [formatServiceDocumentation(service, 'http://example.com')],
			};
		}

		// if matches 'service:action'
		// return hover with documentation for that action
		// TODO: respect handle * and ? wildcards and show summary of all actions
		const hoveredAction = actions[service] && actions[service].find(x => x.name === action);
		if (!hoveredAction) { return emptyResult; }

		return {
			contents: [formatActionDocumentation(hoveredAction)],
		};
	}
};

const formatServiceDocumentation = (service: string, urlDocumentation: string) =>
	`${service} service [IAM Reference](${urlDocumentation})`;

const formatActionDocumentation = (action: IamAction): string => {
	const entries = [];
	entries.push(action.description);
	entries.push('');

	if (action.resourceTypes && action.resourceTypes.length) {
		entries.push('Resource Types:');
		entries.push(action.resourceTypes.map(x => '- ' + x).join('\n'));
		entries.push('');
	}

	if (action.conditionKeys && action.conditionKeys.length) {
		entries.push('Condition Keys:');
		entries.push(action.conditionKeys.map(x => '- ' + x).join('\n'));
		entries.push('');
	}

	entries.push(`[Read more](http://example.com)`);

	return entries.join('\n');
};

// this method is called when your extension is deactivated
export function deactivate() { }

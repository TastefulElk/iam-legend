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
	console.debug('iam-legend extension activating');

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
				documentation: formatActionDocumentation(action),
				// Set explicit range as default behavior is to replace the whole current word.
				// that causes the service prefix to be overwritten with the action so we instead
				// set a range that starts from the current position instead
				range: new vscode.Range(position.line, startIndex, position.line, position.character),
			}));

			return { items: suggestions, isIncomplete: true };
		}

		const wordRange = document.getWordRangeAtPosition(position);
		const word = document.getText(wordRange);

		const labelPrefix = word.startsWith('"') ? '"' : '';
		const labelSuffix = word.endsWith('"') ? '"' : '';


		const suggestions: vscode.CompletionItem[] = serviceKeys.map(service => ({
			label: `${labelPrefix}${service}`,
			filterText: `${labelPrefix}${service}${labelSuffix}`,
			kind: CompletionItemKind.Module,
			documentation: `${service} service [IAM Reference](http://google.com)`,
		}));

		return { items: suggestions, isIncomplete: true };
	}
};

const hoverProvider: vscode.HoverProvider = {
	provideHover(document, position, token) {
		const range = document.getWordRangeAtPosition(position);
		const word = document.getText(range);
		return new vscode.Hover(`I am legend ${word}`);
	}
};

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

	entries.push(`[Read more](${action.documentationUrl})`);

	return entries.join('\n');
};

// this method is called when your extension is deactivated
export function deactivate() { }

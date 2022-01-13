// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CompletionItemKind } from 'vscode';
import { EOL } from 'os';

import { partialMatch, exactMatch } from './match';
import { getActions, IamAction, IamService } from './iamActions';

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

const completionItemProvider: vscode.CompletionItemProvider = {
	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
		if (!isInsideActionsArray(document, position)) { 
			console.debug('outside actions array, not adding suggestions');
			return [];
		}
		console.debug('inside actions array, adding suggestions');
		
		const serviceKeys = Object.keys(services);
		const lineText = document.lineAt(position.line).text;

		const service = serviceKeys.find(x => lineText.includes(`${x}:`));
		if (service) {
			const serviceActions = services[service].actions;
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
			documentation: new vscode.MarkdownString(formatServiceDocumentation(services[service].serviceName, services[service].url)),
		}));

		return { items: suggestions, isIncomplete: true };
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
		const range = document.getWordRangeAtPosition(position);

		const emptyResult = { contents: [] };
		if (!range) { return emptyResult; }

		if (!isInsideActionsArray(document, position)) { 
			return emptyResult;
		}
		
		const word = document.getText(range);
		const trimmedWord = word.replace(/"/g, '').replace(/'/g, '').trim();

		let [serviceName, action] = trimmedWord.split(':');
		if (!services[serviceName]) {
			// if the hovered word doesn't include a known service, try with previous word
			action = serviceName;
			let serviceWordRange = document.getWordRangeAtPosition(new vscode.Position(
				position.line,
				range.start.character - 2
			));
			serviceName = document.getText(serviceWordRange).replace(/"/g, '').replace(/'/g, '').trim();
		}

		// if word matches 'service' but no action
		// return hover with documentation for that service
		if (services[serviceName] && !action) {
			const service = services[serviceName];
			return {
				contents: [formatServiceDocumentation(service.serviceName, service.url)],
			};
		}

		// if matches 'service:action'
		// return hover with documentation for that action
		// if matches multiple actions, return hover with summary of actions
		const hoveredActions = services[serviceName] && services[serviceName].actions.filter(x => exactMatch(action, x.name));
		if (!hoveredActions) { return emptyResult; }

		return {
			contents: hoveredActions.length === 0
				?	['No matching actions']
				: hoveredActions.length === 1
					? [formatActionDocumentation(hoveredActions[0])]
					: [formatShortActionDocumentation(hoveredActions)]
		};
	}
};

const formatServiceDocumentation = (service: string, urlDocumentation: string) =>
	`${service} [IAM Reference](${urlDocumentation})`;

const formatActionDocumentation = (action: IamAction): string => {
	const entries = [];
	entries.push(`**${action.name}**${EOL}`);
	entries.push(`${action.description}${EOL}`);

	if (action.resourceTypes && action.resourceTypes.length) {
		entries.push('Resource Types:');
		entries.push(action.resourceTypes.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.conditionKeys && action.conditionKeys.length) {
		entries.push('Condition Keys:');
		entries.push(action.conditionKeys.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.dependentActions && action.dependentActions.length) {
		entries.push('Dependent Actions:');
		entries.push(action.dependentActions.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.documentationUrl) {
		entries.push(`[Read more](${action.documentationUrl})`);
	}

	return entries.join(EOL);
};

const formatShortActionDocumentation = (actions: IamAction[]): string => {
	const entries = [];
	entries.push('Multiple actions matched:');
	entries.push('');

	entries.push(actions.map(({name, documentationUrl, description}) => {
		const subject = documentationUrl ? `[${name}](${documentationUrl})` : `**${name}**`;
		return `- ${subject}:	${description}`;
	}).join(EOL));
	return entries.join('\n');
};

// this method is called when your extension is deactivated
export function deactivate() { }

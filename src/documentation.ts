import { EOL } from 'os';
import { MarkdownString } from 'vscode';
import { IamService, IamAction } from "./iamActions";

export const createServiceDocs = ({ serviceName, url }: IamService) => 
  new MarkdownString(`${serviceName} [IAM Reference](${url})`);

export const createActionDocs = (action: IamAction) => {
	const lines = [];
	lines.push(`**${action.name}**${EOL}`);
	lines.push(`${action.description}${EOL}`);

	if (action.resourceTypes && action.resourceTypes.length) {
		lines.push('Resource Types:');
		lines.push(action.resourceTypes.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.conditionKeys && action.conditionKeys.length) {
		lines.push('Condition Keys:');
		lines.push(action.conditionKeys.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.dependentActions && action.dependentActions.length) {
		lines.push('Dependent Actions:');
		lines.push(action.dependentActions.map(x => '- ' + x).join(EOL) + EOL);
	}

	if (action.documentationUrl) {
		lines.push(`[Read more](${action.documentationUrl})`);
	}

	return new MarkdownString(lines.join(EOL));
};

export const createActionsSummaryDocs = (actions: IamAction[]) => {
	const lines = [];
	lines.push('Multiple actions matched:');
	lines.push('');

	lines.push(actions.map(({ name, documentationUrl, description }) => {
		const subject = documentationUrl ? `[${name}](${documentationUrl})` : `**${name}**`;
		return `- ${subject}:	${description}`;
	}).join(EOL));

	return new MarkdownString(lines.join(EOL));
};

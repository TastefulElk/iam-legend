import { EOL } from 'os';
import { MarkdownString } from 'vscode';
import { IamService, IamAction } from "./iamActions";

const mdEOL = EOL + EOL; // use two line breaks because markdown..

export const createServiceDocs = ({ serviceName, url }: IamService) =>
  new MarkdownString(`${serviceName} [IAM Reference](${url})`);

export const createActionDocs = (action: IamAction) => {
  const lines = [];

  lines.push(
    action.documentationUrl
      ? `**[${action.name}](${action.documentationUrl})**`
      : `**${action.name}**`
  );

  lines.push(`${action.description}`);

  if (action.resourceTypes && action.resourceTypes.length) {
    lines.push('Resource Types:');
    lines.push(action.resourceTypes.map(x => '- ' + x).join(mdEOL));
  }

  if (action.conditionKeys && action.conditionKeys.length) {
    lines.push('Condition Keys:');
    lines.push(action.conditionKeys.map(x => '- ' + x).join(mdEOL));
  }

  if (action.dependentActions && action.dependentActions.length) {
    lines.push('Dependent Actions:');
    lines.push(action.dependentActions.map(x => '- ' + x).join(mdEOL));
  }

  return new MarkdownString(lines.join(mdEOL));
};

export const createActionsSummaryDocs = (actions: IamAction[]) => {
  const lines = [];
  lines.push('Multiple actions matched:');

  lines.push(actions.map(({ name, documentationUrl, description }) => {
    const subject = documentationUrl
      ? `[${name}](${documentationUrl})`
      : `**${name}**`;
    return `- ${subject}:	${description}`;
  }).join(mdEOL));

  return new MarkdownString(lines.join(mdEOL));
};

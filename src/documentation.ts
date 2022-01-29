import { EOL } from 'os';
import { MarkdownString } from 'vscode';
import { IamService, IamAction } from "./domain";

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
    lines.push(action.resourceTypes.map(x => '- ' + x).join(EOL));
  }

  if (action.conditionKeys && action.conditionKeys.length) {
    lines.push('Condition Keys:');
    lines.push(action.conditionKeys.map(x => '- ' + x).join(EOL));
  }

  if (action.dependentActions && action.dependentActions.length) {
    lines.push('Dependent Actions:');
    lines.push(action.dependentActions.map(x => '- ' + x).join(EOL));
  }

  return new MarkdownString(lines.join(mdEOL));
};

const createServiceActionDocs = ({ serviceName }: IamService, actions: IamAction[]) => {
  const lines = [];
  lines.push(`**${serviceName}**`);
  lines.push(actions.map(x => createShortActionDocs(x).value).join(mdEOL));

  return new MarkdownString(lines.join(mdEOL));
};

const createShortActionDocs = ({ name, documentationUrl, description }: IamAction) => {
  const lines = [];
  lines.push(
    documentationUrl
      ? `**[${name}](${documentationUrl})**`
      : `**${name}**`
  );

  lines.push(`${description}`);

  return new MarkdownString(lines.join(mdEOL));
};

export const createServicesActionDocs = (items: { service: IamService; actions: IamAction[]; }[]): MarkdownString[] => {
  if (items.length === 0) {
    return [new MarkdownString('No matching actions')];
  };

  if (items.length === 1 && items[0].actions.length === 1) {
    return [...items.map(({ service, actions }) => createServiceActionDocs(service, actions))];
  }

  return [new MarkdownString(`Matches multiple actions:${EOL}`), ...items.map(({ service, actions }) => createServiceActionDocs(service, actions))];
};

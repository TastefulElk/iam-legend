import { CompletionItem, CompletionItemKind, CompletionItemProvider, Position, Range, TextDocument } from "vscode";
import { createActionDocs, createServiceDocs } from "./documentation";
import { IamService, IamServicesByPrefix } from "./domain";
import { isInsideActionsArray } from "./domain/utility";

const getActionSuggestions = (services: IamService[], range: Range) => {
  const suggestions: CompletionItem[] = services.map(x => x.actions.map(action => ({
    label: action.name,
    kind: CompletionItemKind.Field,
    data: action,
    documentation: createActionDocs(action),
    detail: x.serviceName,
    // Set explicit range as default behavior is to replace the whole current word.
    // that causes the service prefix to be overwritten with the action so we instead
    // set a range that starts from the current position instead
    range
  }))).flat();

  return { items: suggestions, isIncomplete: true };
};

const getServiceSuggestions = (matchedWord: string, servicesByPrefix: IamServicesByPrefix, range: Range) => {
  // if the matched word starts or ends with quotes, help the json language server
  // to find the correct service name by applying it to the suggestions as it otherwise
  // fails to suggest it
  const labelPrefix = matchedWord.startsWith('"')
    ? '"' : matchedWord.startsWith(`'`)
      ? `'` : '';

  const labelSuffix = matchedWord.endsWith('"')
    ? '"' : matchedWord.endsWith(`'`)
      ? `'` : '';
  
  const suggestions: CompletionItem[] = Object.values(servicesByPrefix).map(service => service.map(x => ({
    label: `${labelPrefix}${x.servicePrefix}`,
    filterText: `${labelPrefix}${x.servicePrefix}${labelSuffix}`,
    kind: CompletionItemKind.Module,
    documentation: createServiceDocs(x),
    detail: x.serviceName,
    // Set explicit range as default behavior is to replace the whole current word.
    // that causes the service prefix to overwrite the action if already present
    // set a range that starts from the current position instead
    range
  }))).flat();

  // preselect the first suggestion, since we likely have the most relevant suggestion here
  suggestions[0].preselect = true;

  return { items: suggestions, isIncomplete: true };
};

const getActionOffset = (word: string, range: Range) => word.indexOf(':') >= 0 ? word.indexOf(':') + 1 + range?.start.character : 0;
const getActionRange = (position: Position, actionOffset: number) => new Range(position.line, actionOffset, position.line, position.character);

export const getCompletionItemProvider = (servicesByPrefix: IamServicesByPrefix): CompletionItemProvider => ({
  provideCompletionItems(document: TextDocument, position: Position) {
    if (!isInsideActionsArray(document, position)) {
      return { items: [], isIncomplete: true };
    }

    const fullWordRange = document.getWordRangeAtPosition(position, /[a-z0-9:-]+/i);
    const fullWord = fullWordRange && document.getText(fullWordRange);
    if (fullWord) {
      const [serviceWord] = fullWord.split(':');

      const services = serviceWord && servicesByPrefix[serviceWord];
      if (services) {
        const actionOffset = getActionOffset(fullWord, fullWordRange);
        const actionRange = getActionRange(position, actionOffset);
        return getActionSuggestions(services, actionRange);
      }
    }

    const partialWordRange = document.getWordRangeAtPosition(position);
    const matchedWord = partialWordRange ? document.getText(partialWordRange) : '';

    const serviceRange = new Range(position.line, partialWordRange?.start.character as number || position.character, position.line, position.character);
    return getServiceSuggestions(matchedWord,servicesByPrefix, serviceRange);
  }
});

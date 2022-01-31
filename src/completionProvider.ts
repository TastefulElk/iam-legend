import { CompletionItem, CompletionItemKind, CompletionItemProvider, Position, Range, TextDocument } from "vscode";
import { createActionDocs, createServiceDocs } from "./documentation";
import { getActionOffset, getActionRange, getFullWordAtPosition, getWordAtPosition } from "./documentParser";
import { IamService, IamServicesByPrefix } from "./domain";
import { isInsideActionsArray } from "./documentParser";
import { getServiceFromServiceAction } from "./domain/utility";

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

const getServiceSuggestions = (matchedWord: string | undefined, servicesByPrefix: IamServicesByPrefix, range: Range) => {
// if the matched word starts or ends with quotes, help the json language server
  // to find the correct service name by applying it to the suggestions as it otherwise
  // fails to suggest it
  const labelPrefix = matchedWord?.startsWith('"')
    ? '"' : matchedWord?.startsWith(`'`)
      ? `'` : '';

  const labelSuffix = matchedWord?.endsWith('"')
    ? '"' : matchedWord?.endsWith(`'`)
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

export const getCompletionItemProvider = (servicesByPrefix: IamServicesByPrefix): CompletionItemProvider => ({
  provideCompletionItems(document: TextDocument, position: Position) {
    if (!isInsideActionsArray(document, position)) {
      return { items: [] };
    }

    const { range, word } = getFullWordAtPosition(document, position);
    if (range && word) {
      const serviceWord = getServiceFromServiceAction(word);

      // if there's a full service prefix at the position, suggest actions for that/those service(s)
      const services = serviceWord && servicesByPrefix[serviceWord];
      if (services) {
        const actionOffset = getActionOffset(word, range);
        const actionRange = getActionRange(position, actionOffset);
        return getActionSuggestions(services, actionRange);
      }
    }

    // check only first part of word at position since some formats treat all values inside quotes
    // as one word, and we're only interested in the service part of the word here
    // const serviceWordRange = document.getWordRangeAtPosition(position);
    // const serviceWord = serviceWordRange ? document.getText(serviceWordRange) : '';
    const { word: serviceWord, range: serviceWordRange } = getWordAtPosition(document, position);

    const serviceRange = new Range(position.line, serviceWordRange?.start.character as number || position.character, position.line, position.character);
    return getServiceSuggestions(serviceWord, servicesByPrefix, serviceRange);
  }
});

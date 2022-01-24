import { CompletionItem, CompletionItemKind, CompletionItemProvider, Position, Range, TextDocument } from "vscode";
import { createActionDocs, createServiceDocs } from "./documentation";
import { IamService, IamServicesByPrefix } from "./iamActions";
import { isInsideActionsArray } from "./utility/utility";

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
        const actionOffset = fullWord.indexOf(':') >= 0 ? fullWord.indexOf(':') + 1 + fullWordRange?.start.character : 0;
        const suggestions: CompletionItem[] = services.map(x => x.actions.map(action => ({
          label: action.name,
          kind: CompletionItemKind.Field,
          data: action,
          documentation: createActionDocs(action),
          // Set explicit range as default behavior is to replace the whole current word.
          // that causes the service prefix to be overwritten with the action so we instead
          // set a range that starts from the current position instead
          detail: x.serviceName,
          range: new Range(position.line, actionOffset, position.line, position.character),
        }))).flat();

        return { items: suggestions, isIncomplete: true };
      }
    }

    const partialWordRange = document.getWordRangeAtPosition(position);
    const word = partialWordRange ? document.getText(partialWordRange) : '';

    const labelPrefix = word.startsWith('"')
      ? '"' : word.startsWith(`'`)
        ? `'` : '';

    const labelSuffix = word.endsWith('"')
      ? '"' : word.endsWith(`'`)
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
      range: new Range(position.line, partialWordRange?.start.character as number || position.character, position.line, position.character),
    }))).flat();

    // preselect the first suggestion, since we likely have the most relevant suggestion here
    suggestions[0].preselect = true;

    return { items: suggestions, isIncomplete: true };
  }
});

import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, Position, Range, TextDocument } from "vscode";
import { createActionDocs, createServiceDocs } from "./documentation";
import { IamService } from "./iamActions";
import { isInsideActionsArray } from "./utility/utility";

export const getCompletionItemProvider = (services: Record<string, IamService>): CompletionItemProvider => ({
  provideCompletionItems(document: TextDocument, position: Position) {
    if (!isInsideActionsArray(document, position)) {
      console.debug('outside actions array, not adding suggestions');
      return { items: [], isIncomplete: true };
    }
    console.debug('inside actions array, adding suggestions');

    const fullWordRange = document.getWordRangeAtPosition(position, /[a-z0-9:-]+/i);
    const [serviceWord] = document.getText(fullWordRange).split(':');

    const service = serviceWord && services[serviceWord];
    if (service) {
      const lineText = document.lineAt(position.line).text;
      const actionOffset = lineText.indexOf(`${service.servicePrefix}:`) + service.servicePrefix.length + 1;
      const suggestions: CompletionItem[] = service.actions.map(action => ({
        label: action.name,
        kind: CompletionItemKind.Field,
        data: action,
        documentation: createActionDocs(action),
        // Set explicit range as default behavior is to replace the whole current word.
        // that causes the service prefix to be overwritten with the action so we instead
        // set a range that starts from the current position instead
        range: new Range(position.line, actionOffset, position.line, position.character),
      }));

      return { items: suggestions, isIncomplete: true };
    }

    const partialWordRange = document.getWordRangeAtPosition(position);
    const word = partialWordRange ? document.getText(partialWordRange) : '';

    const labelPrefix = word.startsWith('"')
      ? '"' : word.startsWith(`'`)
        ? `'` : '';

    const labelSuffix = word.endsWith('"')
      ? '"' : word.endsWith(`'`)
        ? `'` : '';

    const suggestions: CompletionItem[] = Object.values(services).map(service => ({
      label: `${labelPrefix}${service.servicePrefix}`,
      filterText: `${labelPrefix}${service.servicePrefix}${labelSuffix}`,
      kind: CompletionItemKind.Module,
      documentation: createServiceDocs(service),
      // Set explicit range as default behavior is to replace the whole current word.
      // that causes the service prefix to overwrite the action if already present
      // set a range that starts from the current position instead
      range: new Range(position.line, partialWordRange?.start.character as number || position.character, position.line, position.character),
    }));

    // preselect the first suggestion, since we likely have the most relevant suggestion here
    suggestions[0].preselect = true;

    return { items: suggestions, isIncomplete: true };
  }
});

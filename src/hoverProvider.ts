import { HoverProvider, Position } from "vscode";
import { createActionDocs, createActionsSummaryDocs, createServiceDocs } from "./documentation";
import { IamService } from "./iamActions";
import { match } from "./match";
import { isInsideActionsArray, normalize } from "./utility";

export const getHoverProvider = (services: Record<string, IamService>): HoverProvider => ({
  provideHover(document, position) {
    const wordRange = document.getWordRangeAtPosition(position);

    const emptyResult = { contents: [] };
    if (!wordRange) { return emptyResult; }

    if (!isInsideActionsArray(document, position)) {
      return emptyResult;
    }

    const word = normalize(document.getText(wordRange));

    let [serviceName, action] = word.split(':');
    if (!services[serviceName]) {
      // if the hovered word doesn't include a known service, try with previous word
      action = serviceName;
      let serviceWordRange = document.getWordRangeAtPosition(new Position(
        position.line,
        wordRange.start.character - 2
      ));
      serviceName = normalize(document.getText(serviceWordRange));
    }

    const service = services[serviceName];
    if (!service) {
      return emptyResult;
    }

    // if word matches 'service' but no action
    // return hover with documentation for that service
    if (service && !action) {
      return {
        contents: [createServiceDocs(service)],
      };
    }

    if (word.includes(':') && position.character < wordRange.start.character + serviceName.length + 1) {
      return {
        contents: [createServiceDocs(service)],
      };
    }

    // if matches 'service:action'
    // return hover with documentation for that action
    // if matches multiple actions, return hover with summary of actions
    const hoveredActions = service.actions.filter(x => match(action, x.name));
    if (!hoveredActions) { return emptyResult; }

    return {
      contents: hoveredActions.length === 0
        ? ['No matching actions']
        : hoveredActions.length === 1
          ? [createActionDocs(hoveredActions[0])]
          : [createActionsSummaryDocs(hoveredActions)]
    };
  }
});

import { HoverProvider, Position } from "vscode";
import { createServicesActionDocs, createServiceDocs } from "./documentation";
import { IamServicesByPrefix } from "./domain";
import { match } from "./domain/utility/match";
import { isInsideActionsArray } from "./domain/utility/document";
import { normalize } from "./domain/utility/iam";

export const getHoverProvider = (iamServicesByPrefix: IamServicesByPrefix): HoverProvider => ({
  provideHover(document, position) {
    const wordRange = document.getWordRangeAtPosition(position, /[a-z0-9-*]+/i);

    const emptyResult = { contents: [] };
    if (!wordRange) { return emptyResult; }

    if (!isInsideActionsArray(document, position)) {
      return emptyResult;
    }

    const word = normalize(document.getText(wordRange));

    let [serviceName, action] = word.split(':');
    if (!iamServicesByPrefix[serviceName]) {
      // if the hovered word doesn't include a known service, try with previous word
      action = serviceName;
      let serviceWordRange = document.getWordRangeAtPosition(new Position(
        position.line,
        wordRange.start.character - 2
      ), /[a-z0-9-]+/i);
      serviceName = normalize(document.getText(serviceWordRange));
    }

    const services = iamServicesByPrefix[serviceName];
    if (!services) {
      return emptyResult;
    }

    // if word matches 'service' but no action
    // return hover with documentation for that service
    if (services && !action) {
      return {
        contents: services.map(x => createServiceDocs(x)),
      };
    }

    if (word.includes(':') && position.character < wordRange.start.character + serviceName.length + 1) {
      return {
        contents: services.map(x => createServiceDocs(x)),
      };
    }

    const serviceActions = services.map(x => ({ service: x, actions: x.actions.filter(x => match(action, x.name)) })).filter(x => x.actions.length > 0); 
    if (!serviceActions) { return emptyResult; }

    return {
      contents: [...createServicesActionDocs(serviceActions)],
    };
  }
});

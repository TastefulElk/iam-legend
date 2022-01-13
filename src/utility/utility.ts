import { Position, Range, TextDocument } from "vscode";

/**
 * Normalize string to remove invalid characters from service/action names
 *
 * @param {string} text
 */
export const normalize = (text: string) => text.replace(/[^a-z0-9-*:]/gi, ' ').trim();

/**
 * Check whether or not the given position appears to be within an array of actions
 *
 * @param {TextDocument} document
 * @param {Position} position
 * @return {*}  {boolean}
 */
export const isInsideActionsArray = (document: TextDocument, position: Position): boolean => {
  // if current line is actions/notActions field, we are inside the actions field
  const actionsFieldPattern = /^"?(not)?action"?:/i;
  let lineText = document.getText(new Range(position.line, 0, position.line, Number.MAX_VALUE)).toLowerCase();
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

/**
 * Try parse an IAM service name from the given line of text
 *
 * @param {string} text
 * @return {*}  {(string | undefined)}
 */
export const tryParseServiceFromText = (text: string): string | undefined => {
  let match = /([a-z0-9-]*)"?'?:/gi.exec(text);
  if (match) {
    return match[1];
  }
};

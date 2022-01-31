import { Position, Range, TextDocument } from "vscode";

export const getActionOffset = (word: string, range: Range) =>
  word.indexOf(':') >= 0 ? word.indexOf(':') + 1 + range?.start.character : 0;

export const getActionRange = (position: Position, actionOffset: number) =>
  new Range(position.line, actionOffset, position.line, position.character);

export const getFullWordAtPosition = (document: TextDocument, position: Position) => {
  const range = document.getWordRangeAtPosition(position, /[a-z0-9:-]+/i);
  const word = range && document.getText(range);

  return { range, word };
};

export const getWordAtPosition = (document: TextDocument, position: Position) => {
  const range = document.getWordRangeAtPosition(position);
  const word = range && document.getText(range);

  return { range, word };
};

/**
 * Check whether or not the given position appears to be within an array of actions
 *
 * @param {TextDocument} document
 * @param {Position} position
 * @return {*}  {boolean}
 */
export const isInsideActionsArray = (document: TextDocument, position: Position): boolean => {
  // if current line is actions/notActions field, we are inside the actions field
  const actionsPatternSameLine = /^"?(not)?actions?"?\s*[:=]\s+/i; // TODO: Separate matching by file type
  let lineText = document.getText(new Range(position.line, 0, position.line, Number.MAX_VALUE)).trimStart().toLowerCase();
  if (actionsPatternSameLine.test(lineText)) {
    return true;
  }

  // if all previous lines start with '-' or '"' until we find a line that starts with 'actions/notActions', then we're also good
  const actionsPatternOtherLine = /^"?(not)?actions?"?\s*[:=]/i; // same as above minus the trailing whitespace
  let line = position.line - 1;
  while (line > 0) {
    lineText = document.lineAt(line).text.trimStart().toLowerCase();

    if (actionsPatternOtherLine.test(lineText)) {
      return true;
    }

    if (/^["\[-]/.test(lineText)) {
      line--;
      continue;
    }

    return false;
  }

  return false;
};

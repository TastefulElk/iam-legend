import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { commands, Position, ViewColumn, window, workspace } from "vscode";

suite("CompletionProvider", () => {
  window.showInformationMessage("Start CompletionItemProvider tests");

  test("suggests services - yaml", async () => {
    const doc = await workspace.openTextDocument({ language: 'yaml' });
    const editor = await window.showTextDocument(doc, ViewColumn.One);
    await editor.edit(edit => {
      edit.insert(new Position(0, 0), '\n');
      edit.insert(new Position(1, 0), 'action:\n');
      edit.insert(new Position(2, 2), '- ');
    });

    await triggerAndAcceptSuggestion();

    const wordRange = doc.getWordRangeAtPosition(new Position(2, 3));
    const word = doc.getText(wordRange);
    assert.strictEqual(word, 'a4b');
  });

  test("suggests actions - yaml", async () => {
    const doc = await workspace.openTextDocument({ language: 'yaml' });
    const editor = await window.showTextDocument(doc, ViewColumn.One);
    await editor.edit(edit => {
      edit.insert(new Position(0, 0), '\n');
      edit.insert(new Position(1, 0), 'action:\n');
      edit.insert(new Position(2, 2), '- dynamodb:');
    });

    await triggerAndAcceptSuggestion();

    const wordRange = doc.getWordRangeAtPosition(new Position(2, 12));
    const word = doc.getText(wordRange);
    assert.strictEqual(word, 'BatchGetItem');
  });

  test("suggests services - json", async () => {
    const doc = await workspace.openTextDocument({ language: 'yaml' });
    const editor = await window.showTextDocument(doc, ViewColumn.One);
    await editor.edit(edit => {
      edit.insert(new Position(0, 0), '{\n');
      edit.insert(new Position(1, 0), '"action": [\n');
      edit.insert(new Position(2, 2), '"');
    });

    await triggerAndAcceptSuggestion();

    const wordRange = doc.getWordRangeAtPosition(new Position(2, 3));
    const word = doc.getText(wordRange);
    assert.strictEqual(word, 'a4b');
  });

  test("suggests actions - json", async () => {
    const doc = await workspace.openTextDocument({ language: 'yaml' });
    const editor = await window.showTextDocument(doc, ViewColumn.One);
    await editor.edit(edit => {
      edit.insert(new Position(0, 0), '{\n');
      edit.insert(new Position(1, 0), '"action": [\n');
      edit.insert(new Position(2, 2), '"dynamodb:');
    });

    await triggerAndAcceptSuggestion();

    const wordRange = doc.getWordRangeAtPosition(new Position(2, 12), /[a-z]+/i);
    const word = doc.getText(wordRange);
    assert.strictEqual(word, 'BatchGetItem');
  });
});

const triggerAndAcceptSuggestion = async () => {
  await commands.executeCommand('editor.action.triggerSuggest');
  await delay(100); // wait for the suggestions to be populated
  await commands.executeCommand('acceptSelectedSuggestion');
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

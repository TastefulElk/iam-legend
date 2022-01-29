// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { getIamServicesByPrefix } from "./iamProvider";
import { IamServicesByPrefix } from './domain';

import { getHoverProvider } from "./hoverProvider";
import { getCompletionItemProvider } from "./completionProvider";

export async function activate(context: vscode.ExtensionContext) {
  console.info("iam-legend extension activating");

  const iamServicesByPrefix = await getIamServicesByPrefix();
  registerHoverProviders(iamServicesByPrefix, context);
  registerCompletionItemProviders(iamServicesByPrefix, context);
}

const supportedLanguages: vscode.DocumentSelector[] = [{
  language: 'yaml'
}, {
  language: 'json'
}, {
  pattern: '**/*.{tf,tfvars}'
}
];

const registerHoverProviders = (services: IamServicesByPrefix, context: vscode.ExtensionContext) => {
  const hoverProvider = getHoverProvider(services);
  context.subscriptions.push(...supportedLanguages.map(language => vscode.languages.registerHoverProvider(
    language,
    hoverProvider
  )));
};

const registerCompletionItemProviders = (
  iamServicesByPrefix: IamServicesByPrefix,
  context: vscode.ExtensionContext
) => {
  const completionItemProvider = getCompletionItemProvider(iamServicesByPrefix);
  context.subscriptions.push(...supportedLanguages.map(language => vscode.languages.registerCompletionItemProvider(
    language,
    completionItemProvider,
    ':'
  )));
};

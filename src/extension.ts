// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { loadIamServices, IamService } from "./iamActions";

import { getHoverProvider } from "./hoverProvider";
import { getCompletionItemProvider } from "./completionProvider";

export async function activate(context: vscode.ExtensionContext) {
  console.info("iam-legend extension activating");

  const services = await loadIamServices();
  registerHoverProviders(services, context);
  registerCompletionItemProviders(services, context);
}

const supportedLanguages: vscode.DocumentSelector[] = [{
  language: 'yaml'
}, {
  language: 'json'
}, {
  pattern: '**/*.{tf,tfvars}'
}, {
  /* 
    Separate for {.tf/tfvars} since 'terraform' isn't a native
    languageId but is dependent on 3rd party extension.
    therefore we add support for both known file extension and the language
    
    this one gives us support in case user creates a new file in vscode and 
    choses 'terraform' as the language but the file isn't saved yet so it doesn't
    have a file extension
  */
  language: 'terraform'
}];

const registerHoverProviders = (services: Record<string, IamService>, context: vscode.ExtensionContext) => {
  const hoverProvider = getHoverProvider(services);
  context.subscriptions.push(...supportedLanguages.map(language => vscode.languages.registerHoverProvider(
    language,
    hoverProvider
  )));
};

const registerCompletionItemProviders = (
  services: Record<string, IamService>,
  context: vscode.ExtensionContext
) => {
  const completionItemProvider = getCompletionItemProvider(services);
  context.subscriptions.push(...supportedLanguages.map(language => vscode.languages.registerCompletionItemProvider(
    language,
    completionItemProvider,
    ':'
  )));
};

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import { loadIamServices, IamService } from "./iamActions";

import { getHoverProvider } from "./hoverProvider";
import { getCompletionItemProvider } from "./completionProvider";

export async function activate(context: vscode.ExtensionContext) {
  console.info("iam-legend extension activating");

  const services = await loadIamServices();
  registerHoverProviders(services);
  registerCompletionItemProviders(services);
}

const registerHoverProviders = (services: Record<string, IamService>) => {
  const hoverProvider = getHoverProvider(services);
  vscode.languages.registerHoverProvider({ language: "yaml" }, hoverProvider);
  vscode.languages.registerHoverProvider({ language: "json" }, hoverProvider);
};

const registerCompletionItemProviders = (
  services: Record<string, IamService>
) => {
  const completionItemProvider = getCompletionItemProvider(services);
  vscode.languages.registerCompletionItemProvider(
    { language: "yaml" },
    completionItemProvider
  );
  vscode.languages.registerCompletionItemProvider(
    { language: "json" },
    completionItemProvider
  );
};

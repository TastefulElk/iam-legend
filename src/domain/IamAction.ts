export interface IamAction {
  name: string;
  description: string;
  resourceTypes: string[];
  conditionKeys: string[];
  dependentActions: string[];
  documentationUrl: string;
}

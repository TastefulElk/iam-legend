import { promisify } from 'util';
import { readdir, readFile } from 'fs';
import { resolve } from 'path';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

export interface IamService {
  serviceName: string;
  servicePrefix: string;
  url: string;
  actions: IamAction[];
}

export interface IamAction {
  name: string;
  description: string;
  resourceTypes: string[];
  conditionKeys: string[];
  dependentActions: string[];
  documentationUrl: string;
}

export const loadIamServices = async (): Promise<Record<string, IamService>> => {
  const files = await readdirAsync(resolve(__dirname, 'iam-services'));
  const readFiles = files.map(
    file => readFileAsync(resolve(__dirname, 'iam-services', file), 'utf8')
      .then((data) => JSON.parse(data))
  );

  const services = (await Promise.all(readFiles)).reduce((acc, curr) => ({
    ...acc,
    [curr.servicePrefix]: curr
  }), {});
  return services;
};

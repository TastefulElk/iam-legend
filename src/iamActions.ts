import { promisify } from 'util';
import { readdir, readFile } from 'fs';
import { resolve } from 'path';
import groupBy from './utility/groupBy';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);


export type IamServicesByPrefix = Record<ServicePrefix, IamService[]>;

type ServicePrefix = string;

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


export const getIamServicesByPrefix = async (): Promise<IamServicesByPrefix> => {
  const files = await readdirAsync(resolve(__dirname, 'iam-services'));
  const readFiles = files.map(
    file => readFileAsync(resolve(__dirname, 'iam-services', file), 'utf8')
      .then((data) => JSON.parse(data))
  );

  const services = await Promise.all(readFiles);
  const servicesByPrefix = groupBy(services, 'servicePrefix');
  return servicesByPrefix as IamServicesByPrefix;
};

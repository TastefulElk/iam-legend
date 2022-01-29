import { IamAction } from "./IamAction";

export interface IamService {
  serviceName: string;
  servicePrefix: string;
  url: string;
  actions: IamAction[];
}

export type IamServicesByPrefix = Record<ServicePrefix, IamService[]>;

type ServicePrefix = string;

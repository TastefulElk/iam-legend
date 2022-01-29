import { promisify } from 'util';
import { readdir, readFile } from 'fs';
import { resolve } from 'path';
import groupBy from './domain/utility/groupBy';
import { IamServicesByPrefix } from './domain';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

export const getIamServicesByPrefix = async (): Promise<IamServicesByPrefix> => {
  const files = await readdirAsync(resolve(__dirname, 'data', 'iam-services'));
  const readFiles = files.map(
    file => readFileAsync(resolve(__dirname, 'data', 'iam-services', file), 'utf8')
      .then((data) => JSON.parse(data))
  );

  const services = await Promise.all(readFiles);
  const servicesByPrefix = groupBy(services, 'servicePrefix');
  return servicesByPrefix as IamServicesByPrefix;
};

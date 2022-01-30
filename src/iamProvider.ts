import { promisify } from 'util';
import { readdir, readFile } from 'fs';
import { resolve } from 'path';
import { groupBy } from './domain/utility';
import { IamService, IamServicesByPrefix } from './domain';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

export const getIamServicesByPrefix = async (): Promise<IamServicesByPrefix> => {
  const directory = resolve(__dirname, 'data', 'iam-services');
  const files = await readdirAsync(directory);
  const readFiles = files.map(
    file => readFileAsync(resolve(directory, file), 'utf8')
      .then((data) => JSON.parse(data) as IamService)
  );

  const services = await Promise.all(readFiles);
  const servicesByPrefix = groupBy(services, 'servicePrefix');
  return servicesByPrefix as IamServicesByPrefix;
};

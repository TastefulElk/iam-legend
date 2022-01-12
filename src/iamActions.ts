import { promisify } from 'util';
import { readdir, readFile } from 'fs';

const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);

export interface IamAction {
	name: string;
	description: string;
	resourceTypes: string[];
	conditionKeys: string[];
	dependentActions: string[];
	documentationUrl: string;
}

export const getActions = async (): Promise<Record<string, IamAction[]>> => {
  const files = await readdirAsync('./iam-services');
  const readFiles = files.map(
    file => readFileAsync(`./iam-services/${file}`, 'utf8')
      .then((data) => ({
        service: fileNameWithoutExtension(file),
        actions: JSON.parse(data)
      }))
  );

  const actions = (await Promise.all(readFiles)).reduce((acc, curr) => ({
    ...acc,
    [curr.service]: curr.actions
  }), {});
  return actions;
};

const fileNameWithoutExtension = (fileName: string) => {
  const index = fileName.lastIndexOf('.');
  return fileName.substring(0, index);
};

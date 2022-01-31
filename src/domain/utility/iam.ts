/**
 * Normalize string to remove invalid characters from service/action names
 *
 * @param {string} text
 */
 export const normalize = (text: string) => 
  text.replace(/[^a-z0-9-\*:]/gi, ' ').trim();
 
export const getServiceFromServiceAction = (serviceAction: string): string =>
  serviceAction.split(':')[0];

/** 
  * Match a pattern that supports * and ? wildcards against a string
  * Allows for partial matches
  *
  * @param {string} pattern The pattern to match with
  * @param {string} str The string to match against
  * @return {boolean} True if the pattern matches the string 
  */
export const match = (pattern: string, str: string): boolean => {
  const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
  const regex = new RegExp(regexPattern);

  return regex.test(str);
};

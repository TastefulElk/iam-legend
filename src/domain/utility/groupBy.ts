const groupBy = (arr: Record<string, any>[], key: string): Record<string, unknown[]> =>
  arr.reduce((acc, curr) => {
    if (curr[key] === undefined) {
      throw new Error(`Key ${key} is not present in the object`);
    }

    const value = curr[key];

    acc[value] = [curr, ...acc[value] || []];
    return acc;
  }, {});

export default groupBy;
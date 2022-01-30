import { groupBy } from '../../domain/utility';

describe('[groupBy]', () => {
  it('should group an array of objects by the given key', () => {
    const arr = [{
      a: '123',
      b: '456'
    }, {
      a: '123',
      b: '789'
    }, {
      a: '456',
      b: '123'
    }];

    const actual = groupBy(arr, 'a');

    expect(actual['123'].length).toBe(2);
    expect(actual['456'].length).toBe(1);
  });

  it('should return an empty object if the array is empty', () => {
    const arr = [];
    const actual = groupBy(arr, 'a');

    expect(Object.keys(actual).length).toBe(0);
  });

  it('should throw if the given key is not present in all objects', () => {
    const arr = [{
      a: '123',
      b: '456',
      c: '789'
    }, {
      a: '123',
      b: '789'
    }];

    expect(() => groupBy(arr, 'c')).toThrow();
  });
});

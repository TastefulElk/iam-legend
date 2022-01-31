import { getServiceFromServiceAction } from "../../domain/utility";

describe('[iam]', () => {
  describe('[getServiceFromServiceAction]', () => {
    it('should return service from serviceAction string', () => {
      const serviceAction = 'dynamodb:PutItem';
      const expected = 'dynamodb';
      const actual = getServiceFromServiceAction(serviceAction);

      expect(actual).toEqual(expected);
    });

    it('should return full input string if no action', () => {
      const serviceAction = 'dynamodb';
      const expected = 'dynamodb';
      const actual = getServiceFromServiceAction(serviceAction);

      expect(actual).toEqual(expected);
    });
  });
  
});

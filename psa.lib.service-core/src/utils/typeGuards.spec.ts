import { expect } from 'chai';
import { isArrayOfStrings } from './typeGuards';

describe('typeGuards', () => {
  describe('isArrayOfStrings()', () => {
    it('should return whether input is an array of strings', () => {
      const array = ['a', 'b', 'c'];
      expect(isArrayOfStrings('no array')).to.be.false;
      expect(isArrayOfStrings(array)).to.be.true;
    });
  });
});

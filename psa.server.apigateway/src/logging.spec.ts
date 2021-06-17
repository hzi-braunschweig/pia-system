import { expect } from 'chai';
import { Logging } from './logging';
import { StatusCode } from './statusCode';

describe('Logging', () => {
  it('colorizeStatus should keep status', () => {
    for (let i = 0; i < StatusCode.MAX; i++) {
      expect(Logging.colorizeStatus(i)).to.contain(i.toString());
    }
  });
});

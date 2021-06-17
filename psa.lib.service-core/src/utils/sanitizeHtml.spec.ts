import { expect } from 'chai';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml()', () => {
  it('should remove malicious code from a html string', () => {
    const result = sanitizeHtml('<img src=x onerror=alert(1)//>');
    expect(result).not.to.include('alert(1)');
  });
});

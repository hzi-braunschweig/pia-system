import { expect } from 'chai';
import { HttpConnection } from './configModel';

describe('HttpConnection', () => {
  it('should return an url string', () => {
    const port = 80;
    const conn = new HttpConnection('http', 'localhost', port);
    expect(conn.url).to.eql('http://localhost:80');
  });
});

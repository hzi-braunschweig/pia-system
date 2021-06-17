import chai from 'chai';
import chaiHttp from 'chai-http';

import { Server } from '../example-service/server';
import { config } from '../example-service/config';

chai.use(chaiHttp);
const expect = chai.expect;
const HTTP_OK = 200;

const apiAddress = 'http://localhost:' + config.public.port.toString();

describe('/example/version', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /example/version', () => {
    it('should return http 200 with version information', async () => {
      const result = await chai.request(apiAddress).get('/example/version');
      expect(result, result.text).to.have.status(HTTP_OK);
      expect(result.body).to.eql({
        PIPELINE_ID: '17479',
        GIT_HASH: 'fbf64670',
        GIT_REF: '1.18.0',
      });
    });
  });
});

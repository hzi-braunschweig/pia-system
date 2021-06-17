import chai from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import { getSecretOrPrivateKey, signToken } from '../../src/utils/testUtils';

import { Server } from '../example-service/server';
import { config } from '../example-service/config';

chai.use(chaiHttp);
const expect = chai.expect;

const apiAddress = 'http://localhost:' + config.public.port.toString();

const probandToken = signToken(
  {
    id: 1,
    role: 'Proband',
    username: 'QTestProband1',
    groups: ['QTestStudy1'],
  },
  getSecretOrPrivateKey(__dirname)
);

describe('/example', () => {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET /example/{name}', () => {
    it('should not accept unauthorized requests', async () => {
      const result = await chai.request(apiAddress).get('/example/Testname');
      expect(result, result.text).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return http 200 with an example', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/example/Testname')
        .set({ authorization: probandToken });

      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body).to.eql({
        name: 'Testname',
        age: 21,
      });
    });
  });
});

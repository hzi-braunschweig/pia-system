const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT;
const { db } = require('../../src/db');
const pgHelper = require('../../src/services/postgresqlHelper');
const sandbox = require('sinon').createSandbox();

const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};
const pmToken1 = JWT.sign(pmSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmHeader1 = { authorization: pmToken1 };

const forscherSession1 = { id: 1, role: 'Forscher', username: 'QTestForscher' };
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherHeader1 = { authorization: forscherToken1 };

describe('Getting user Data', async function () {
  before(async function () {
    db.none(
      "INSERT INTO users (username, password, role) VALUES ('QTestProbandenManager', '', 'ProbandenManager'),('QTestForscher', '', 'Forscher')"
    );
    await server.init();
  });

  after(async function () {
    db.none(
      "DELETE FROM users WHERE username IN ('QTestProbandenManager', 'QTestForscher')"
    );
    await server.stop();
  });

  afterEach(async function () {
    sandbox.restore();
  });

  describe('GET /user/users/ids/{ids}', async function () {
    let getUserAsProfessionalByIDSStub;
    const ids = '25a682a1-7f4c-4394-bbb3-aa2d03896742';

    beforeEach(async function () {
      getUserAsProfessionalByIDSStub = sandbox
        .stub(pgHelper, 'getUserAsProfessionalByIDS')
        .resolves({ username: 'QTEST-1234567890' });
    });

    it('should return http 401 for a missing auth key', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/user/users/ids/' + ids);
      expect(result).to.have.status(401);
    });

    it('should return http 401 for a wrong auth key', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/user/users/ids/' + ids)
        .set({ authorization: 'header.payload.signature' });
      expect(result).to.have.status(401);
    });

    it('should return http 200 if user exists', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/user/users/ids/' + ids)
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(getUserAsProfessionalByIDSStub.calledOnce).to.be.true;
      const ids2 = getUserAsProfessionalByIDSStub.args[0][0];
      expect(ids2).to.equal(ids);
      const requesterName = getUserAsProfessionalByIDSStub.args[0][1];
      expect(requesterName).to.equal(pmSession1.username);
      expect(result.body.username).to.equal('QTEST-1234567890');
    });

    it('should return 403 if role is not ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/user/users/ids/' + ids)
        .set(forscherHeader1);
      expect(result).to.have.status(403);
      expect(result.body.error).to.equal('Forbidden');
    });

    it('should return 404 if user does not exist', async function () {
      getUserAsProfessionalByIDSStub.resolves(null);
      const result = await chai
        .request(apiAddress)
        .get('/user/users/ids/' + ids)
        .set(pmHeader1);
      console.log(result.body);
      expect(result).to.have.status(404);
    });
  });
});

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');
const fetchMock = require('fetch-mock').sandbox();
const fetch = require('node-fetch');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');
const { setup, cleanup } = require('./pendingDeletions.spec.data/setup.helper');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';
const serverSandbox = sinon.createSandbox();

const testSandbox = sinon.createSandbox();

const probandSession1 = { id: 1, role: 'Proband', username: 'ApiTestProband1' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher1@apitest.de',
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut1@apitest.de',
};
const sysadminSession1 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa1@apitest.de',
};
const sysadminSession2 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa2@apitest.de',
};
const sysadminSession3 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa3@apitest.de',
};
const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@apitest.de',
};
const pmSession2 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm2@apitest.de',
};
const pmSession3 = { id: 1, role: 'ProbandenManager', username: 'pmNoEmail' };
const pmSession4 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm4@apitest.de',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = JWT.sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken1 = JWT.sign(utSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken1 = JWT.sign(sysadminSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken2 = JWT.sign(sysadminSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken3 = JWT.sign(sysadminSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken1 = JWT.sign(pmSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken2 = JWT.sign(pmSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken3 = JWT.sign(pmSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken4 = JWT.sign(pmSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const utHeader1 = { authorization: utToken1 };
const sysadminHeader1 = { authorization: sysadminToken1 };
const sysadminHeader2 = { authorization: sysadminToken2 };
const sysadminHeader3 = { authorization: sysadminToken3 };
const pmHeader1 = { authorization: pmToken1 };
const pmHeader2 = { authorization: pmToken2 };
const pmHeader3 = { authorization: pmToken3 };
const pmHeader4 = { authorization: pmToken4 };

describe('/pendingDeletions', function () {
  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    testSandbox.stub(fetch, 'default').callsFake(fetchMock);
    fetchMock
      .catch(503)
      .post('express:/log/systemLogs', {}, { name: 'createSystemLog' })
      .delete('express:/log/logs/:pseudonym', 204)
      .delete('express:/personal/personalData/proband/:pseudonym', 204, {
        name: 'deletePersonalDataOfUser',
      });
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('GET pendingdeletions/id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries for proband pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries for sample pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234562')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries for study pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234565')
        .set(pmHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(pmHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/999999')
        .set(pmHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234560')
        .set(pmHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by without email address', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234561')
        .set(pmHeader3);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234561);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband1');
    });

    it('should return HTTP 200 with the pending deletion for a sample id', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234562')
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234562);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });

    it('should return HTTP 200 with the pending deletion for a study id', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/1234565')
        .set(sysadminHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234565);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });
  });

  describe('GET pendingdeletions/proband/proband_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband1')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion user id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/nonexistingProband')
        .set(pmHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/proband/ApiTestProband2')
        .set(pmHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');
    });
  });

  describe('GET pendingdeletions/sample/sample_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion sample id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/nonexistingProband')
        .set(pmHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 when the pending deletion os not of type sample', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/ApiTestProband1')
        .set(pmHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_by', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234562);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/sample/APISAMPLE_11111')
        .set(pmHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234562);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');
    });
  });

  describe('GET pendingdeletions/study/study_id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a om tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(pmHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending deletion study id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiNonExistingStudy')
        .set(sysadminHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending deletion for sysadmin who is requested_by', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234565);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });

    it('should return HTTP 200 with the pending deletion for pm who is requested_for', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingdeletions/study/ApiTestStudie1')
        .set(sysadminHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234565);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');
    });
  });

  describe('POST pendingdeletions', function () {
    beforeEach(async function () {
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const pDValid1 = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband4',
    };

    const pDValid2 = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11113',
    };

    const pDValid3 = {
      requested_for: 'sa2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie2',
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@pm.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDwrongType = {
      requested_for: 'pm2@apitest.de',
      type: 'wrongtype',
      for_id: 'ApiTestProband1',
    };

    const pDwrongTypeForRole1 = {
      requested_for: 'pm2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie1',
    };

    const pDwrongTypeForRole2 = {
      requested_for: 'sa2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDwrongTypeForRole3 = {
      requested_for: 'sa2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDwrongProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'NonexistingProband',
    };

    const pDwrongSample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'nonexistingSample',
    };

    const pDNoEmailProband = {
      requested_for: 'pmNoEmail',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDNoEmailSample = {
      requested_for: 'pmNoEmail',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDWrongStudyPM = {
      requested_for: 'pm4@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDWrongStudyProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband2',
    };

    const pDWrongStudySample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11112',
    };

    const pDConflictProband = {
      requested_for: 'pm2@apitest.de',
      type: 'proband',
      for_id: 'ApiTestProband1',
    };

    const pDConflictSample = {
      requested_for: 'pm2@apitest.de',
      type: 'sample',
      for_id: 'APISAMPLE_11111',
    };

    const pDConflictStudy = {
      requested_for: 'sa2@apitest.de',
      type: 'study',
      for_id: 'ApiTestStudie1',
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when a sysadmin tries for proband deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDwrongTypeForRole2);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a sysadmin tries for sample deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDwrongTypeForRole3);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a pm tries for study deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongTypeForRole1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a pm tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader2)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when a pm from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader4)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when requested_for is no email address and not change proband status', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDNoEmailProband);
      expect(result).to.have.status(422);
      db.one('SELECT * FROM users WHERE username=$1', ['ApiTestProband1']).then(
        (user) => {
          expect(user.username).to.equal('ApiTestProband1');
          expect(user.account_status).to.equal('active');
          expect(user.study_status).to.equal('active');
        }
      );
    });

    it('should return HTTP 422 when requested_for is no email address and not change sample status', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDNoEmailSample);
      expect(result).to.have.status(422);
      db.one('SELECT * FROM lab_results WHERE id=$1', ['APISAMPLE_11111']).then(
        (lab_result) => {
          expect(lab_result.id).to.equal('APISAMPLE_11111');
          expect(lab_result.study_status).to.equal('active');
        }
      );
    });

    it('should return HTTP 403 when requested_for is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudyPM);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when target proband is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudyProband);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when target sample is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDWrongStudySample);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when target sample is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongSample);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target proband is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongProband);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 400 when type is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDwrongType);
      expect(result).to.have.status(400);
    });

    it('should return HTTP 403 when targeted proband has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDConflictProband);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when targeted sample has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDConflictSample);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when targeted study has a deletion request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDConflictStudy);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and update proband for proband pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband4');

      db.one("SELECT * FROM users WHERE username='ApiTestProband4'").then(
        (user) => {
          expect(user.username).to.equal('ApiTestProband4');
          expect(user.account_status).to.equal('active');
          expect(user.study_status).to.equal('deletion_pending');
        }
      );
    });

    it('should return HTTP 200 and update lab_result for sample pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader1)
        .send(pDValid2);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11113');

      db.one('SELECT * FROM lab_results WHERE id=$1', ['APISAMPLE_11111']).then(
        (lab_result) => {
          expect(lab_result.id).to.equal('APISAMPLE_11111');
          expect(lab_result.study_status).to.equal('deletion_pending');
        }
      );
    });

    it('should return HTTP 200 and update proband for proband pending deletion if no_email_pm requests', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(pmHeader3)
        .send(pDValid1);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband4');

      db.one('SELECT * FROM users WHERE username=$1', ['ApiTestProband4']).then(
        (user) => {
          expect(user.username).to.equal('ApiTestProband4');
          expect(user.account_status).to.equal('active');
          expect(user.study_status).to.equal('deletion_pending');
        }
      );
    });

    it('should return HTTP 200 and update study for study pending deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingdeletions')
        .set(sysadminHeader1)
        .send(pDValid3);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie2');

      db.one("SELECT * FROM studies WHERE name='ApiTestStudie2'").then(
        (study) => {
          expect(study.name).to.equal('ApiTestStudie2');
          expect(study.status).to.equal('deletion_pending');
        }
      );
    });
  });

  describe('PUT pendingdeletions/id', function () {
    describe('wrong access', function () {
      before(async function () {
        await setup();
      });

      after(async function () {
        await cleanup();
      });

      it('should return HTTP 401 when the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(invalidHeader)
          .send({});
        expect(result).to.have.status(401);
      });

      it('should return HTTP 403 when a proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(probandHeader1)
          .send({});
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 when a forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(forscherHeader1)
          .send({});
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 when a ut tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(utHeader1)
          .send({});
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 requested_by pm tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(pmHeader1)
          .send({});
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 requested_by sysadmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234562')
          .set(sysadminHeader1)
          .send({});
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 wrong pm tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234560')
          .set(pmHeader3)
          .send({});
        expect(result).to.have.status(403);
      });
    });

    describe('right access', function () {
      beforeEach(async function () {
        await setup();
      });

      afterEach(async function () {
        await cleanup();
      });

      it('should return HTTP 200 and delete all of probands data', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234561')
          .set(pmHeader2)
          .send({});
        expect(result).to.have.status(200);
        expect(result.body.requested_by).to.equal('pmNoEmail');
        expect(result.body.requested_for).to.equal('pm2@apitest.de');
        expect(result.body.type).to.equal('proband');
        expect(result.body.for_id).to.equal('ApiTestProband1');

        const lab_observations = await db.manyOrNone(
          'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const lab_result = await db.manyOrNone(
          'SELECT * FROM lab_results WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const blood_sample = await db.manyOrNone(
          'SELECT * FROM blood_samples WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances_queued = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const answers = await db.manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const user_images = await db.manyOrNone(
          'SELECT * FROM user_files WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const notification_schedules = await db.manyOrNone(
          'SELECT * FROM notification_schedules WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const proband = await db.one('SELECT * FROM users WHERE username=$1', [
          'ApiTestProband1',
        ]);
        expect(fetchMock.called('createSystemLog')).to.be.true;
        expect(fetchMock.called('deletePersonalDataOfUser')).to.be.true;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.length).to.equal(0);
        expect(blood_sample.length).to.equal(0);
        expect(questionnaire_instances.length).to.equal(0);
        expect(questionnaire_instances_queued.length).to.equal(0);
        expect(answers.length).to.equal(0);
        expect(user_images.length).to.equal(0);
        expect(notification_schedules.length).to.equal(0);

        expect(proband.username).to.equal('ApiTestProband1');
        expect(proband.password).to.equal('');
        expect(proband.role).to.equal('Proband');
        expect(proband.study_status).to.equal('deleted');
        expect(proband.account_status).to.equal('deactivated');

        expect(proband.fcm_token).to.equal(null);
        expect(proband.first_logged_in_at).to.equal(null);
        expect(proband.notification_time).to.equal(null);
        expect(proband.logged_in_with).to.equal(null);
        expect(proband.compliance_labresults).to.equal(null);
        expect(proband.compliance_samples).to.equal(null);
        expect(proband.needs_material).to.equal(null);
        expect(proband.pw_change_needed).to.equal(null);
        expect(proband.number_of_wrong_attempts).to.equal(null);
        expect(proband.third_wrong_password_at).to.equal(null);
        expect(proband.study_center).to.equal(null);
        expect(proband.examination_wave).to.equal(null);
        expect(proband.compliance_bloodsamples).to.equal(null);
      });

      it('should return HTTP 200 and delete all of samples data', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234562')
          .set(pmHeader2)
          .send({});
        expect(result).to.have.status(200);
        expect(result.body.requested_by).to.equal('pm1@apitest.de');
        expect(result.body.requested_for).to.equal('pm2@apitest.de');
        expect(result.body.type).to.equal('sample');
        expect(result.body.for_id).to.equal('APISAMPLE_11111');

        const lab_observations = await db.manyOrNone(
          "SELECT * FROM lab_observations WHERE lab_result_id='APISAMPLE_11111'"
        );
        const lab_result = await db.one(
          "SELECT * FROM lab_results WHERE id='APISAMPLE_11111'"
        );
        expect(fetchMock.called('createSystemLog')).to.be.true;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.id).to.equal('APISAMPLE_11111');
        expect(lab_result.order_id).to.equal(null);
        expect(lab_result.status).to.equal(null);
        expect(lab_result.remark).to.equal(null);
        expect(lab_result.new_samples_sent).to.equal(null);
        expect(lab_result.performing_doctor).to.equal(null);
        expect(lab_result.dummy_sample_id).to.equal(null);
        expect(lab_result.study_status).to.equal('deleted');
      });

      it('should return HTTP 200 and delete all of study data', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/pendingdeletions/1234565')
          .set(sysadminHeader2)
          .send({});

        expect(result).to.have.status(200);
        expect(result.body.requested_by).to.equal('sa1@apitest.de');
        expect(result.body.requested_for).to.equal('sa2@apitest.de');
        expect(result.body.type).to.equal('study');
        expect(result.body.for_id).to.equal('ApiTestStudie1');

        const lab_observations = await db.manyOrNone(
          'SELECT * FROM lab_observations WHERE lab_result_id=ANY(SELECT id FROM lab_results WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const lab_result = await db.manyOrNone(
          'SELECT * FROM lab_results WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const blood_sample = await db.manyOrNone(
          'SELECT * FROM blood_samples WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const questionnaire_instances_queued = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances_queued WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const answers = await db.manyOrNone(
          'SELECT * FROM answers WHERE questionnaire_instance_id=ANY(SELECT id FROM questionnaire_instances WHERE user_id=$1)',
          ['ApiTestProband1']
        );
        const user_images = await db.manyOrNone(
          'SELECT * FROM user_files WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const notification_schedules = await db.manyOrNone(
          'SELECT * FROM notification_schedules WHERE user_id=$1',
          ['ApiTestProband1']
        );
        const probands = await db.manyOrNone(
          'SELECT * FROM users WHERE username=$1',
          ['ApiTestProband1']
        );
        const planned_probands = await db.manyOrNone(
          'SELECT * FROM planned_probands WHERE user_id IN(SELECT user_id FROM study_planned_probands WHERE study_id=$1)',
          ['ApiTestStudie1']
        );
        const study_accesses = await db.manyOrNone(
          'SELECT * FROM study_users WHERE study_id=$1',
          ['ApiTestStudie1']
        );
        const questionnaires = await db.manyOrNone(
          'SELECT * FROM questionnaires WHERE study_id=$1',
          ['ApiTestStudie1']
        );
        const study = await db.one('SELECT * FROM studies WHERE name=$1', [
          'ApiTestStudie1',
        ]);
        expect(fetchMock.called('createSystemLog')).to.be.true;

        expect(lab_observations.length).to.equal(0);
        expect(lab_result.length).to.equal(0);
        expect(blood_sample.length).to.equal(0);
        expect(questionnaire_instances.length).to.equal(0);
        expect(questionnaire_instances_queued.length).to.equal(0);
        expect(answers.length).to.equal(0);
        expect(user_images.length).to.equal(0);
        expect(notification_schedules.length).to.equal(0);
        expect(study_accesses.length).to.equal(0);
        expect(questionnaires.length).to.equal(0);
        expect(probands.length).to.equal(0);
        expect(planned_probands.length).to.equal(0);

        expect(study.name).to.equal('ApiTestStudie1');
        expect(study.description).to.equal(null);
        expect(study.pm_email).to.equal(null);
        expect(study.hub_email).to.equal(null);
        expect(study.status).to.equal('deleted');
      });
    });
  });

  describe('DELETE pendingdeletions/id', function () {
    before(async function () {
      await setup();
    });

    after(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and cancel deletion of proband data for requested_by pm', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband2');

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband2',
      ]);
      const pending_deletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        [1234560]
      );

      expect(pending_deletion).to.equal(null);
      expect(proband.username).to.equal('ApiTestProband2');
      expect(proband.role).to.equal('Proband');
      expect(proband.study_status).to.equal('active');
      expect(proband.account_status).to.equal('active');
    });

    it('should return HTTP 200 and cancel deletion of proband data for requested_for pm', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234561')
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('proband');
      expect(result.body.for_id).to.equal('ApiTestProband1');

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband2',
      ]);
      const pending_deletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        [1234561]
      );

      expect(pending_deletion).to.equal(null);
      expect(proband.username).to.equal('ApiTestProband2');
      expect(proband.role).to.equal('Proband');
      expect(proband.study_status).to.equal('active');
      expect(proband.account_status).to.equal('active');
    });

    it('should return HTTP 200 and cancel the deletion of sample data', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234562')
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.type).to.equal('sample');
      expect(result.body.for_id).to.equal('APISAMPLE_11111');

      const lab_result = await db.one('SELECT * FROM lab_results WHERE id=$1', [
        'APISAMPLE_11111',
      ]);
      const pending_deletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        [1234562]
      );

      expect(pending_deletion).to.equal(null);
      expect(lab_result.id).to.equal('APISAMPLE_11111');
      expect(lab_result.study_status).to.equal('active');
    });

    it('should return HTTP 200 and cancel the deletion of study data', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingdeletions/1234565')
        .set(sysadminHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('sa1@apitest.de');
      expect(result.body.requested_for).to.equal('sa2@apitest.de');
      expect(result.body.type).to.equal('study');
      expect(result.body.for_id).to.equal('ApiTestStudie1');

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'ApiTestStudie1',
      ]);
      const pending_deletion = await db.oneOrNone(
        'SELECT * FROM pending_deletions WHERE id=$1',
        [1234565]
      );

      expect(pending_deletion).to.equal(null);
      expect(study.name).to.equal('ApiTestStudie1');
      expect(study.status).to.equal('active');
    });
  });
});

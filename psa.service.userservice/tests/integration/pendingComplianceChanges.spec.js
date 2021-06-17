const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');

const server = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';
const serverSandbox = sinon.createSandbox();

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const { config } = require('../../src/config');
const loggingserviceUrl = config.services.loggingservice.url;

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
const pmHeader1 = { authorization: pmToken1 };
const pmHeader2 = { authorization: pmToken2 };
const pmHeader3 = { authorization: pmToken3 };
const pmHeader4 = { authorization: pmToken4 };

describe('/pendingComplianceChanges', function () {
  let fetchStub;

  before(async function () {
    await server.init();
  });

  after(async function () {
    await server.stop();
    serverSandbox.restore();
  });

  beforeEach(() => {
    fetchStub = testSandbox.stub(fetch, 'default');
    fetchStub.callsFake(async (url, options) => {
      console.log(url);
      let body;
      if (
        url === loggingserviceUrl + '/log/systemLogs' &&
        options.method === 'post'
      ) {
        body = { ...options.body };
        body.timestamp = new Date();
      } else {
        return new fetch.Response(null, { status: 404 });
      }
      return new fetch.Response(JSON.stringify(body));
    });
  });

  afterEach(() => {
    testSandbox.restore();
  });

  describe('GET pendingcompliancechanges/id', function () {
    before(async function () {
      await cleanUp();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband2',
          '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher1@apitest.de',
          '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pmNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm4@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestStudie1 Beschreibung'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234560,
          'pm1@apitest.de',
          'pm2@apitest.de',
          'ApiTestProband1',
          false,
          true,
          false,
          true,
          false,
          true,
        ],
      ]);
      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234561,
          'pmNoEmail',
          'pm2@apitest.de',
          'ApiTestProband1',
          false,
          true,
          false,
          true,
          false,
          true,
        ],
      ]);
    });

    after(async function () {
      await cleanUp();
    });

    async function cleanUp() {
      await db.none('DELETE FROM users WHERE username IN ($1:csv)', [
        [
          'ApiTestProband1',
          'ApiTestProband2',
          'forscher1@apitest.de',
          'forscher2@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
          'pmNoEmail',
          'pm4@apitest.de',
          'sa1@apitest.de',
          'sa2@apitest.de',
        ],
      ]);
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie1',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(probandHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(forscherHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(utHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries that is not involved in the deletion', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(pmHeader3);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 404 when the pending compliance change id does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/999999')
        .set(pmHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(pmHeader1);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');
      expect(result.body.compliance_labresults_from).to.equal(false);
      expect(result.body.compliance_labresults_to).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_for', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234560')
        .set(pmHeader2);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234560);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');
      expect(result.body.compliance_labresults_from).to.equal(false);
      expect(result.body.compliance_labresults_to).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);
    });

    it('should return HTTP 200 with the pending compliance change for pm who is requested_by without email address', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/pendingcompliancechanges/1234561')
        .set(pmHeader3);
      expect(result).to.have.status(200);
      expect(result.body.id).to.equal(1234561);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');
      expect(result.body.compliance_labresults_from).to.equal(false);
      expect(result.body.compliance_labresults_to).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);
    });
  });

  describe('POST pendingcompliancechanges', function () {
    beforeEach(async function () {
      await cleanUp();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband2',
          '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband3',
          '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher1@apitest.de',
          '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pmNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm4@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestStudie1 Beschreibung'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234560,
          'pm1@apitest.de',
          'pm2@apitest.de',
          'ApiTestProband3',
          false,
          true,
          false,
          true,
          false,
          true,
        ],
      ]);
    });

    afterEach(async function () {
      await cleanUp();
    });

    async function cleanUp() {
      await db.none('DELETE FROM users WHERE username IN ($1:csv)', [
        [
          'ApiTestProband1',
          'ApiTestProband2',
          'ApiTestProband3',
          'forscher1@apitest.de',
          'forscher2@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
          'pmNoEmail',
          'pm4@apitest.de',
          'sa1@apitest.de',
          'sa2@apitest.de',
        ],
      ]);
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie1',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    const pDValid1 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDValid2 = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: false,
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@pm.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDwrongProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'NonexistingProband',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDNoEmailFor = {
      requested_for: 'pmNoEmail',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyPM = {
      requested_for: 'pm4@apitest.de',
      proband_id: 'ApiTestProband1',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDWrongStudyProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband2',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    const pDConflictProband = {
      requested_for: 'pm2@apitest.de',
      proband_id: 'ApiTestProband3',
      compliance_labresults_to: true,
      compliance_samples_to: false,
      compliance_bloodsamples_to: true,
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when a pm tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader2)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a pm from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader4)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when requested_for is no email address and not create pending compliance change object', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDNoEmailFor);
      expect(result).to.have.status(422);
      db.oneOrNone(
        'SELECT * FROM pending_compliance_changes WHERE proband_id=$1',
        ['ApiTestProband1']
      ).then((cc) => {
        expect(cc).to.equal(null);
      });
    });

    it('should return HTTP 422 when requested_for is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyPM);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target proband is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDWrongStudyProband);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target proband is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongProband);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target pm is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when targeted proband has a change request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDConflictProband);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and create pending compliance change', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');

      expect(result.body.compliance_labresults_to).to.equal(true);
      expect(result.body.compliance_samples_to).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);
    });

    it('should return HTTP 200 and create pending compliance change if no_email_pm requests', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader3)
        .send(pDValid1);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pmNoEmail');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');

      expect(result.body.compliance_labresults_to).to.equal(true);
      expect(result.body.compliance_samples_to).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);
    });

    it('should return HTTP 200 and create pending compliance change with a view missing params', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingcompliancechanges')
        .set(pmHeader1)
        .send(pDValid2);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');

      expect(result.body.compliance_labresults_to).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(true);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);
    });
  });

  describe('PUT pendingcompliancechanges/id', function () {
    beforeEach(async function () {
      await cleanUp();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband2',
          '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher1@apitest.de',
          '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pmNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm4@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestStudie1 Beschreibung'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO questionnaires VALUES($1:csv)', [
        [
          123456,
          'ApiTestStudie1',
          'ApiQuestionnaireName1',
          1,
          0,
          'once',
          0,
          0,
          3,
          'not_title',
          'not_body1',
          'not_body1',
          null,
          null,
          null,
          null,
          true,
        ],
      ]);
      await db.none('INSERT INTO questionnaires VALUES($1:csv)', [
        [
          123457,
          'ApiTestStudie1',
          'ApiQuestionnaireName2',
          1,
          0,
          'once',
          0,
          0,
          3,
          'not_title',
          'not_body1',
          'not_body1',
          null,
          null,
          null,
          null,
          false,
        ],
      ]);
      await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
        [
          123456,
          'ApiTestStudie1',
          123456,
          'ApiQuestionnaireName1',
          'ApiTestProband1',
          new Date(),
          null,
          null,
          0,
          'active',
        ],
      ]);
      await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
        [
          123457,
          'ApiTestStudie1',
          123456,
          'ApiQuestionnaireName1',
          'ApiTestProband1',
          new Date(),
          null,
          null,
          1,
          'inactive',
        ],
      ]);
      await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
        [
          123458,
          'ApiTestStudie1',
          123456,
          'ApiQuestionnaireName1',
          'ApiTestProband1',
          new Date(),
          null,
          null,
          1,
          'expired',
        ],
      ]);
      await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
        [
          123459,
          'ApiTestStudie1',
          123456,
          'ApiQuestionnaireName1',
          'ApiTestProband1',
          new Date(),
          null,
          null,
          1,
          'released_once',
        ],
      ]);
      await db.none('INSERT INTO questionnaire_instances VALUES($1:csv)', [
        [
          123460,
          'ApiTestStudie1',
          123457,
          'ApiQuestionnaireName2',
          'ApiTestProband1',
          new Date(),
          null,
          null,
          1,
          'active',
        ],
      ]);

      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234560,
          'pm1@apitest.de',
          'pm2@apitest.de',
          'ApiTestProband1',
          true,
          false,
          true,
          false,
          true,
          true,
        ],
      ]);
      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234561,
          'pm1@apitest.de',
          'pm2@apitest.de',
          'ApiTestProband1',
          true,
          false,
          true,
          true,
          true,
          true,
        ],
      ]);
    });

    afterEach(async function () {
      await cleanUp();
    });

    async function cleanUp() {
      await db.none('DELETE FROM users WHERE username IN ($1:csv)', [
        [
          'ApiTestProband1',
          'ApiTestProband2',
          'forscher1@apitest.de',
          'forscher2@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
          'pmNoEmail',
          'pm4@apitest.de',
          'sa1@apitest.de',
          'sa2@apitest.de',
        ],
      ]);
      await db.none(
        'DELETE FROM questionnaires WHERE study_id=$1 OR study_id=$2',
        ['ApiTestStudie1', 'ApiTestStudie2']
      );
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie1',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when requested_by pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and change probands compliances, delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234560')
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(200);

      expect(result.body.compliance_labresults_to).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband1',
      ]);
      const instances = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      expect(fetchStub.calledOnce).to.be.true;

      expect(instances.length).to.equal(3);
      expect(proband.username).to.equal('ApiTestProband1');
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(false);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and change probands compliances, not delete compliance needes fb instances and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingcompliancechanges/1234561')
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(200);

      expect(result.body.compliance_labresults_to).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(true);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband1',
      ]);
      const instances = await db.manyOrNone(
        'SELECT * FROm questionnaire_instances WHERE user_id=$1',
        ['ApiTestProband1']
      );
      expect(fetchStub.calledOnce).to.be.true;

      expect(instances.length).to.equal(5);
      expect(proband.username).to.equal('ApiTestProband1');
      expect(proband.compliance_labresults).to.equal(false);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });

  describe('DELETE pendingcompliancechanges/id', function () {
    beforeEach(async function () {
      await cleanUp();

      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband1',
          '0a0ff736e8179cb486d87e30d86625957458e49bdc1df667e9bbfdb8f535ee6253aeda490c02d1370e8891e84bb5b54b38bdb1c2dbdf66b383b50711adc33b9b',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ApiTestProband2',
          '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
          'Proband',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher1@apitest.de',
          '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'ut2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Untersuchungsteam',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pmNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'pm4@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'ProbandenManager',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa1@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'sa2@apitest.de',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'SysAdmin',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestStudie1 Beschreibung'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'],
      ]);
      await db.none('INSERT INTO studies VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pmNoEmail', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'pm4@apitest.de', 'write'],
      ]);

      await db.none('INSERT INTO pending_compliance_changes VALUES($1:csv)', [
        [
          1234560,
          'pm1@apitest.de',
          'pm2@apitest.de',
          'ApiTestProband1',
          true,
          false,
          true,
          false,
          true,
          true,
        ],
      ]);
    });

    afterEach(async function () {
      await cleanUp();
    });

    async function cleanUp() {
      await db.none('DELETE FROM users WHERE username IN ($1:csv)', [
        [
          'ApiTestProband1',
          'ApiTestProband2',
          'forscher1@apitest.de',
          'forscher2@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
          'pmNoEmail',
          'pm4@apitest.de',
          'sa1@apitest.de',
          'sa2@apitest.de',
        ],
      ]);
      await db.none('DELETE FROM studies WHERE name IN($1:csv)', [
        [
          'ApiTestStudie1',
          'ApiTestStudie2',
          'ApiTestMultiProband',
          'ApiTestMultiProf',
        ],
      ]);
    }

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(pmHeader3)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_by pm', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');

      expect(result.body.compliance_labresults_to).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband1',
      ]);
      const pending_compliance_change = await db.oneOrNone(
        'SELECT * FROM pending_compliance_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_compliance_change).to.equal(null);
      expect(proband.username).to.equal('ApiTestProband1');
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });

    it('should return HTTP 200 and cancel changing of proband compliances for requested_for pm', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingcompliancechanges/1234560')
        .set(pmHeader2)
        .send({});
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('pm1@apitest.de');
      expect(result.body.requested_for).to.equal('pm2@apitest.de');
      expect(result.body.proband_id).to.equal('ApiTestProband1');

      expect(result.body.compliance_labresults_to).to.equal(false);
      expect(result.body.compliance_samples_to).to.equal(false);
      expect(result.body.compliance_bloodsamples_to).to.equal(true);

      expect(result.body.compliance_labresults_from).to.equal(true);
      expect(result.body.compliance_samples_from).to.equal(true);
      expect(result.body.compliance_bloodsamples_from).to.equal(true);

      const proband = await db.one('SELECT * FROM users WHERE username=$1', [
        'ApiTestProband1',
      ]);
      const pending_compliance_change = await db.oneOrNone(
        'SELECT * FROM pending_compliance_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_compliance_change).to.equal(null);
      expect(proband.username).to.equal('ApiTestProband1');
      expect(proband.compliance_labresults).to.equal(true);
      expect(proband.compliance_samples).to.equal(true);
      expect(proband.compliance_bloodsamples).to.equal(true);
    });
  });
});

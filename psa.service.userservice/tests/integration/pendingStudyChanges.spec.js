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
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher2@apitest.de',
};
const forscherSession3 = {
  id: 1,
  role: 'Forscher',
  username: 'forscherNoEmail',
};
const forscherSession4 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher4@apitest.de',
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
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken3 = JWT.sign(forscherSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken4 = JWT.sign(forscherSession4, secretOrPrivateKey, {
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

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };
const forscherHeader3 = { authorization: forscherToken3 };
const forscherHeader4 = { authorization: forscherToken4 };
const utHeader1 = { authorization: utToken1 };
const sysadminHeader1 = { authorization: sysadminToken1 };
const pmHeader1 = { authorization: pmToken1 };

describe('/pendingStudyChanges', function () {
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

  describe('POST pendingstudychanges', function () {
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
          'forscherNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher4@apitest.de',
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
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie1', 'ApiTestStudie1 Beschreibung', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]', false]]
      );

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
        ['ApiTestStudie1', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscherNoEmail', 'admin'],
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
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscherNoEmail', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher4@apitest.de', 'write'],
      ]);

      await db.none(
        "INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to, has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to, sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from, has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from, has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from, has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to, has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from, has_compliance_opposition_to, has_logging_opt_in_from, has_logging_opt_in_to)VALUES(1234560, 'forscher1@apitest.de', 'forscher2@apitest.de', 'ApiTestStudie2', 'ApiTestStudie2 Beschreibung', 'DescriptionChange', FALSE, TRUE, NULL, NULL, 0, 0, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE)"
      );
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
          'forscherNoEmail',
          'forscher4@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
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
      requested_for: 'forscher2@apitest.de',
      study_id: 'ApiTestStudie1',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'LOCAL',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
      has_logging_opt_in_to: true,
    };

    const pDValid2 = {
      requested_for: 'forscher2@apitest.de',
      study_id: 'ApiTestMultiProf',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'RSIST',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
      has_logging_opt_in_to: true,
    };

    const pDValid3 = {
      requested_for: 'forscher2@apitest.de',
      study_id: 'ApiTestStudie1',
      description_to: null,
      sample_prefix_to: null,
      sample_suffix_length_to: null,
      pseudonym_prefix_to: 'LOCAL',
      pseudonym_suffix_length_to: 4,
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@forscher.de',
      study_id: 'ApiTestStudie1',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'RSIST',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    const pDwrongStudy = {
      requested_for: 'forscher2@apitest.de',
      study_id: 'NonexistingStudy',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'RSIST',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    const pDNoEmailFor = {
      requested_for: 'forscherNoEmail',
      study_id: 'ApiTestStudie1',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'RSIST',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    const pDWrongStudyForscher = {
      requested_for: 'forscher4@apitest.de',
      study_id: 'ApiTestStudie1',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'RSIST',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    const pDWrongAccessToStudyForscher = {
      requested_for: 'forscher4@apitest.de',
      study_id: 'ApiTestMultiProf',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'LOCAL',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    const pDConflictStudy = {
      requested_for: 'forscher2@apitest.de',
      study_id: 'ApiTestStudie2',
      description_to: 'DescriptionChange',
      has_rna_samples_to: true,
      sample_prefix_to: 'PREFIX_EDIT',
      sample_suffix_length_to: 20,
      pseudonym_prefix_to: 'LOCAL',
      pseudonym_suffix_length_to: 4,
      has_answers_notify_feature_to: true,
      has_answers_notify_feature_by_mail_to: true,
      has_four_eyes_opposition_to: false,
      has_partial_opposition_to: false,
      has_total_opposition_to: false,
      has_compliance_opposition_to: false,
    };

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(invalidHeader)
        .send(pDValid1);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(utHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 422 when a forscher tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader2)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a forscher from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader4)
        .send(pDValid1);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when a forscher with wrong study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader4)
        .send(pDValid2);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when requested_for is no email address and not create pending compliance change object', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDNoEmailFor);
      expect(result).to.have.status(422);
      db.oneOrNone('SELECT * FROM pending_study_changes WHERE study_id=$1', [
        'ApiTestMultiProf',
      ]).then((cc) => {
        expect(cc).to.equal(null);
      });
    });

    it('should return HTTP 422 when requested_for is in wrong study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDWrongStudyForscher);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when requested_for has wrong study access', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDWrongAccessToStudyForscher);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target study is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDwrongStudy);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when target forscher is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDwrongFor);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 422 when pseudonym prefix does not exist in mapping', async function () {
      pDValid2.pseudonym_prefix_to = 'None';
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDValid2);
      expect(result).to.have.status(422);
    });

    it('should return HTTP 403 when targeted study has a change request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDConflictStudy);
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and create pending compliance change', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('forscher1@apitest.de');
      expect(result.body.requested_for).to.equal('forscher2@apitest.de');
      expect(result.body.study_id).to.equal('ApiTestStudie1');

      expect(result.body.description_to).to.equal('DescriptionChange');
      expect(result.body.has_rna_samples_to).to.equal(true);
      expect(result.body.sample_prefix_to).to.equal('PREFIX_EDIT');
      expect(result.body.sample_suffix_length_to).to.equal(20);
      expect(result.body.has_answers_notify_feature_to).to.equal(true);
      expect(result.body.has_answers_notify_feature_by_mail_to).to.equal(true);
      expect(result.body.has_four_eyes_opposition_to).to.equal(false);
      expect(result.body.has_partial_opposition_to).to.equal(false);
      expect(result.body.has_total_opposition_to).to.equal(false);
      expect(result.body.has_compliance_opposition_to).to.equal(false);
      expect(result.body.has_logging_opt_in_to).to.equal(true);

      expect(result.body.description_from).to.equal(
        'ApiTestStudie1 Beschreibung'
      );
      expect(result.body.has_rna_samples_from).to.equal(true);
      expect(result.body.sample_prefix_from).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length_from).to.equal(10);
      expect(result.body.has_answers_notify_feature_from).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail_from).to.equal(
        false
      );
      expect(result.body.has_four_eyes_opposition_from).to.equal(true);
      expect(result.body.has_partial_opposition_from).to.equal(true);
      expect(result.body.has_total_opposition_from).to.equal(true);
      expect(result.body.has_compliance_opposition_from).to.equal(true);
      expect(result.body.has_logging_opt_in_from).to.equal(false);
    });

    it('should return HTTP 200 and create pending compliance change with a few missing params and nulls', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDValid3);
      expect(result).to.have.status(200);
      expect(result.body.requested_by).to.equal('forscher1@apitest.de');
      expect(result.body.requested_for).to.equal('forscher2@apitest.de');
      expect(result.body.study_id).to.equal('ApiTestStudie1');

      expect(result.body.description_to).to.equal(null);
      expect(result.body.has_rna_samples_to).to.equal(true);
      expect(result.body.sample_prefix_to).to.equal(null);
      expect(result.body.sample_suffix_length_to).to.equal(null);
      expect(result.body.has_answers_notify_feature_to).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail_to).to.equal(false);
      expect(result.body.has_four_eyes_opposition_to).to.equal(true);
      expect(result.body.has_partial_opposition_to).to.equal(true);
      expect(result.body.has_total_opposition_to).to.equal(true);
      expect(result.body.has_compliance_opposition_to).to.equal(true);
      expect(result.body.has_logging_opt_in_to).to.equal(false);

      expect(result.body.description_from).to.equal(
        'ApiTestStudie1 Beschreibung'
      );
      expect(result.body.has_rna_samples_from).to.equal(true);
      expect(result.body.sample_prefix_from).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length_from).to.equal(10);
      expect(result.body.has_answers_notify_feature_from).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail_from).to.equal(
        false
      );
      expect(result.body.has_four_eyes_opposition_from).to.equal(true);
      expect(result.body.has_partial_opposition_from).to.equal(true);
      expect(result.body.has_total_opposition_from).to.equal(true);
      expect(result.body.has_compliance_opposition_from).to.equal(true);
      expect(result.body.has_logging_opt_in_from).to.equal(false);
    });
  });

  describe('PUT pendingstudychanges/id', function () {
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
          'forscherNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher4@apitest.de',
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
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie1', 'ApiTestStudie1 Beschreibung', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]', false]]
      );

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
        ['ApiTestStudie1', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscherNoEmail', 'admin'],
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
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscherNoEmail', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher4@apitest.de', 'write'],
      ]);

      await db.none(
        "INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to, has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to, sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from, has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from, has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from, has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to, has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from, has_compliance_opposition_to, has_logging_opt_in_from, has_logging_opt_in_to)VALUES(1234560, 'forscher1@apitest.de', 'forscher2@apitest.de', 'ApiTestStudie1', 'ApiTestStudie1 Beschreibung', 'DescriptionChange', FALSE, TRUE, NULL, NULL, 0, 0, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE)"
      );
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
          'forscherNoEmail',
          'forscher4@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
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
        .put('/pendingstudychanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when requested_by forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader3)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and change study data and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'ApiTestStudie1',
      ]);
      expect(fetchStub.calledOnce).to.be.true;

      expect(study.description).to.equal('DescriptionChange');
      expect(study.has_rna_samples).to.equal(true);
      expect(study.sample_prefix).to.equal(null);
      expect(study.sample_suffix_length).to.equal(0);
      expect(study.has_answers_notify_feature).to.equal(true);
      expect(study.has_answers_notify_feature_by_mail).to.equal(true);
      expect(study.has_four_eyes_opposition).to.equal(false);
      expect(study.has_partial_opposition).to.equal(false);
      expect(study.has_total_opposition).to.equal(false);
      expect(study.has_compliance_opposition).to.equal(false);
      expect(study.has_logging_opt_in).to.equal(true);
    });
  });

  describe('DELETE pendingstudychanges/id', function () {
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
          'forscherNoEmail',
          'd72f039889ceb351fee4751d7ede5b1073e480ceebedb9a7f45d5144af05c117ad1ac20619f5a1a63aceaa34fe837bccb43c858274f4b03f355f0982710f9e0b',
          'Forscher',
          '',
          null,
        ],
      ]);
      await db.none('INSERT INTO users VALUES ($1:csv)', [
        [
          'forscher4@apitest.de',
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
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie1', 'ApiTestStudie1 Beschreibung', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestStudie2', 'ApiTestStudie2 Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]', false]]
      );
      await db.none(
        'INSERT INTO studies(name, description, has_logging_opt_in) VALUES ($1:csv)',
        [['ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]', false]]
      );

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
        ['ApiTestStudie1', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie2', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestStudie1', 'forscherNoEmail', 'admin'],
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
        ['ApiTestMultiProband', 'ApiTestProband1', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband2', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProband', 'ApiTestProband3', 'read'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut1@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'ut2@apitest.de', 'write'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher1@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher2@apitest.de', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscherNoEmail', 'admin'],
      ]);
      await db.none('INSERT INTO study_users VALUES ($1:csv)', [
        ['ApiTestMultiProf', 'forscher4@apitest.de', 'write'],
      ]);

      await db.none(
        'INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to, has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to, sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from, has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from, has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from, has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to, has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from, has_compliance_opposition_to, has_logging_opt_in_from, has_logging_opt_in_to) ' +
          "VALUES(1234560, 'forscher1@apitest.de', 'forscher2@apitest.de', 'ApiTestStudie1', 'ApiTestStudie1 Beschreibung', 'DescriptionChange', false, true, null, null, 0, 0, false, true, false, true, true, false, true, false, true, false, true, false, false, true)"
      );
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
          'forscherNoEmail',
          'forscher4@apitest.de',
          'ut1@apitest.de',
          'ut2@apitest.de',
          'pm1@apitest.de',
          'pm2@apitest.de',
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
        .delete('/pendingstudychanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(forscherHeader3)
        .send({});
      expect(result).to.have.status(403);
    });

    it('should return HTTP 200 and cancel changing of study data for requested_by forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'ApiTestStudie1',
      ]);
      const pending_study_change = await db.oneOrNone(
        'SELECT * FROM pending_study_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_study_change).to.equal(null);

      expect(study.description).to.equal('ApiTestStudie1 Beschreibung');
      expect(study.has_rna_samples).to.equal(true);
      expect(study.sample_prefix).to.equal('ZIFCO');
      expect(study.sample_suffix_length).to.equal(10);
      expect(study.has_answers_notify_feature).to.equal(false);
      expect(study.has_answers_notify_feature_by_mail).to.equal(false);
      expect(study.has_four_eyes_opposition).to.equal(true);
      expect(study.has_partial_opposition).to.equal(true);
      expect(study.has_total_opposition).to.equal(true);
      expect(study.has_compliance_opposition).to.equal(true);
      expect(study.has_logging_opt_in).to.equal(false);
    });

    it('should return HTTP 200 and cancel changing of study data for requested_for forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'ApiTestStudie1',
      ]);
      const pending_study_change = await db.oneOrNone(
        'SELECT * FROM pending_study_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_study_change).to.equal(null);

      expect(study.description).to.equal('ApiTestStudie1 Beschreibung');
      expect(study.has_rna_samples).to.equal(true);
      expect(study.sample_prefix).to.equal('ZIFCO');
      expect(study.sample_suffix_length).to.equal(10);
      expect(study.has_answers_notify_feature).to.equal(false);
      expect(study.has_answers_notify_feature_by_mail).to.equal(false);
      expect(study.has_four_eyes_opposition).to.equal(true);
      expect(study.has_partial_opposition).to.equal(true);
      expect(study.has_total_opposition).to.equal(true);
      expect(study.has_compliance_opposition).to.equal(true);
      expect(study.has_logging_opt_in).to.equal(false);
    });
  });
});

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');
const { setup, cleanup } = require('./studies.spec.data/setup.helper');

const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT + '/questionnaire';

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const probandSession2 = { id: 1, role: 'Proband', username: 'QTestProband2' };
const forscherSession = { id: 1, role: 'Forscher', username: 'QTestForscher1' };
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
};
const sysadminSession = { id: 1, role: 'SysAdmin', username: 'QTestSysAdmin' };
const utSession = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
};
const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
};

const invalidToken = JWT.sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = JWT.sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = JWT.sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken = JWT.sign(forscherSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = JWT.sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const sysadminToken = JWT.sign(sysadminSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const utToken = JWT.sign(utSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const forscherHeader = { authorization: forscherToken };
const forscherHeader2 = { authorization: forscherToken2 };
const sysadminHeader = { authorization: sysadminToken };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };

const studyContact =
  'Studienzentrum des ApiTestStudie für Infektionsforschung<br> ApiTestStudie<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: ApiTestStudie@ApiTestStudie.de';
const studyWelcomeText =
  '# Welcome to our study! We are happy to have you with us!';
const sanitizedText = 'Welcome <img src="x"> home !';

const anotherStudyWelcomeText =
  '# Your are welcome to participate in our study!';

describe('/studies', function () {
  before(async function () {
    await server.init();
    await setup();
  });

  after(async function () {
    await server.stop();
    await cleanup();
  });

  describe('GET studies', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 200 with the correct studies for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(2);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.studies[0].pm_email).to.equal(undefined);
      expect(result.body.studies[0].hub_email).to.equal(undefined);
      expect(result.body.studies[0].has_rna_samples).to.equal(false);
      expect(result.body.studies[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.studies[0].sample_suffix_length).to.equal(5);
      expect(result.body.studies[0].has_answers_notify_feature).to.equal(false);
      expect(
        result.body.studies[0].has_answers_notify_feature_by_mail
      ).to.equal(false);
      expect(result.body.studies[0].has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with the correct studies for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(forscherHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(2);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.studies[0].access_level).to.equal('write');
      expect(result.body.studies[0].pm_email).to.equal('pm@pia.de');
      expect(result.body.studies[0].hub_email).to.equal('hub@pia.de');
      expect(result.body.studies[0].has_rna_samples).to.equal(false);
      expect(result.body.studies[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.studies[0].sample_suffix_length).to.equal(5);
      expect(result.body.studies[0].has_answers_notify_feature).to.equal(false);
      expect(
        result.body.studies[0].has_answers_notify_feature_by_mail
      ).to.equal(false);
      expect(result.body.studies[0].has_logging_opt_in).to.equal(false);
      expect(result.body.studies[0].pendingStudyChange).to.equal(undefined);

      expect(result.body.studies[1].name).to.equal('ApiTestMultiProfs');
      expect(result.body.studies[1].pendingStudyChange).to.not.equal(undefined);
      expect(result.body.studies[1].pendingStudyChange.study_id).to.equal(
        'ApiTestMultiProfs'
      );
      expect(result.body.studies[1].pendingStudyChange.requested_by).to.equal(
        'QTestForscher1'
      );
      expect(result.body.studies[1].pendingStudyChange.requested_for).to.equal(
        'QTestForscher2'
      );

      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with the correct studies for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(2);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.studies[0].access_level).to.equal('write');
      expect(result.body.studies[0].pm_email).to.equal('pm@pia.de');
      expect(result.body.studies[0].hub_email).to.equal('hub@pia.de');
      expect(result.body.studies[0].has_rna_samples).to.equal(false);
      expect(result.body.studies[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.studies[0].sample_suffix_length).to.equal(5);
      expect(result.body.studies[0].has_answers_notify_feature).to.equal(false);
      expect(
        result.body.studies[0].has_answers_notify_feature_by_mail
      ).to.equal(false);
      expect(result.body.studies[0].has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with the correct studies for ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(2);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.studies[0].access_level).to.equal('write');
      expect(result.body.studies[0].pm_email).to.equal('pm@pia.de');
      expect(result.body.studies[0].hub_email).to.equal('hub@pia.de');
      expect(result.body.studies[0].has_rna_samples).to.equal(false);
      expect(result.body.studies[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.studies[0].sample_suffix_length).to.equal(5);
      expect(result.body.studies[0].has_answers_notify_feature).to.equal(false);
      expect(
        result.body.studies[0].has_answers_notify_feature_by_mail
      ).to.equal(false);
      expect(result.body.studies[0].has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with the correct studies for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length >= 7).to.equal(true);
      expect(result.body.links.self.href).to.equal('/studies');
    });
  });

  describe('GET studies/proband/username', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(sysadminHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with matching studies of a proband for a Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(forscherHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(1);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with matching studies of a proband for a UT', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(1);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with matching studies of a proband for a PM', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband1')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(1);
      expect(result.body.studies[0].name).to.equal('ApiTestStudie');
      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with empty array if probands and reuesters studies do not overlap', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/proband/QTestProband2')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.studies.length).to.equal(0);
      expect(result.body.links.self.href).to.equal('/studies');
    });
  });

  describe('GET studies/id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if the study id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/NotAValidStudy')
        .set(probandHeader1);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the Proband has no read access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(probandHeader2);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the Forscher has no read access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudi2')
        .set(forscherHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudie');
      expect(result.body.pm_email).to.equal(undefined);
      expect(result.body.hub_email).to.equal(undefined);
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudie');
    });

    it('should return HTTP 200 with the correct study for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(forscherHeader);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudie');
      expect(result.body.access_level).to.equal('write');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudie');
    });

    it('should return HTTP 200 with the correct study for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(utHeader);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudie');
      expect(result.body.access_level).to.equal('write');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudie');
    });

    it('should return HTTP 200 with the correct study for ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(pmHeader);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudie');
      expect(result.body.access_level).to.equal('write');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudie');
    });

    it('should return HTTP 200 with the correct study for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudie')
        .set(sysadminHeader);
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudie');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudie');
    });
  });

  describe('GET studies/addresses', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(invalidHeader);
      expect(result).to.have.status(401);
    });

    it('should return HTTP 404 if the Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(forscherHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(utHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the Probandenmanager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(pmHeader);
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(probandHeader1);
      expect(result).to.have.status(200);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].address).to.equal(studyContact);
      expect(result.body[0].name).to.equal('ApiTestStudie');
    });
  });

  describe('POST studies', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(invalidHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'NewApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(401);
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewApiTestStudie',
        });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(probandHeader1)
        .send({
          name: 'NewApiTestStudie',
          description: 'NewApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(forscherHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'NewApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(utHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'NewApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(pmHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'NewApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the study name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 400 if the email is not valid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'ApiTestStudie Beschreibung',
          pm_email: 'pmpmpm',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 200 and create the study for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewApiTestStudie',
          description: 'ApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('NewApiTestStudie');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/NewApiTestStudie');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewApiTestStudie')
        .set(sysadminHeader);
      expect(result2).to.have.status(200);
      expect(result2.body.name).to.equal('NewApiTestStudie');
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty pm email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewApiTestStudie2',
          description: 'ApiTestStudie Beschreibung',
          pm_email: null,
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('NewApiTestStudie2');
      expect(result.body.pm_email).to.equal(null);
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal(
        '/studies/NewApiTestStudie2'
      );
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewApiTestStudie2')
        .set(sysadminHeader);
      expect(result2).to.have.status(200);
      expect(result2.body.name).to.equal('NewApiTestStudie2');
      expect(result2.body.pm_email).to.equal(null);
      expect(result2.body.hub_email).to.equal('hub@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty hub email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewApiTestStudie3',
          description: 'ApiTestStudie Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: null,
        });
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('NewApiTestStudie3');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal(null);
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal(
        '/studies/NewApiTestStudie3'
      );
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewApiTestStudie3')
        .set(sysadminHeader);
      expect(result2).to.have.status(200);
      expect(result2.body.name).to.equal('NewApiTestStudie3');
      expect(result2.body.hub_email).to.equal(null);
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });
  });

  describe('PUT studies/id', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(invalidHeader)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudi3Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
          has_rna_samples: false,
          sample_prefix: 'TESTPREFIXEDIT',
          sample_suffix_length: 6,
        });
      expect(result).to.have.status(401);
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(sysadminHeader)
        .send({ name: 'ApiTestStudie' });
      expect(result).to.have.status(400);
    });

    it('should return HTTP 404 if the study does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/NotAValidStudy')
        .set(sysadminHeader)
        .send({
          name: 'NotAValidStudy',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(probandHeader1)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(utHeader)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(pmHeader)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(forscherHeader)
        .send({
          name: 'ApiTestStudie',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the new name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(sysadminHeader)
        .send({
          name: 'ApiTestStudie2',
          description: 'ApiTestStudieChanged Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 404 if the study name changes for a study that has users assigned to it', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudie')
        .set(sysadminHeader)
        .send({
          name: 'ApiTestStudieChanged',
          description: 'ApiTestStudi2Changed Beschreibung Changed',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(404);
    });

    it('should return HTTP 200 and change only fields a sysadmin is allowed to change', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/ApiTestStudi2')
        .set(sysadminHeader)
        .send({
          name: 'ApiTestStudi2',
          description: 'ApiTestStudi2 Beschreibung Changed2',
          pm_email: 'pm@pia2.de',
          hub_email: 'hub@pia2.de',
        });
      expect(result).to.have.status(200);
      expect(result.body.name).to.equal('ApiTestStudi2');
      expect(result.body.description).to.equal(
        'ApiTestStudi2 Beschreibung Changed2'
      );
      expect(result.body.pm_email).to.equal('pm@pia2.de');
      expect(result.body.hub_email).to.equal('hub@pia2.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/ApiTestStudi2');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/ApiTestStudi2')
        .set(forscherHeader2);
      expect(result2).to.have.status(200);
      expect(result2.body.name).to.equal('ApiTestStudi2');
      expect(result2.body.description).to.equal(
        'ApiTestStudi2 Beschreibung Changed2'
      );
      expect(result2.body.pm_email).to.equal('pm@pia2.de');
      expect(result2.body.hub_email).to.equal('hub@pia2.de');
      expect(result2.body.has_rna_samples).to.equal(true);
      expect(result2.body.sample_prefix).to.equal('ZIFCO');
      expect(result2.body.sample_suffix_length).to.equal(10);
      expect(result2.body.has_answers_notify_feature).to.equal(false);
      expect(result2.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result2.body.has_logging_opt_in).to.equal(false);
    });
  });

  describe('/studies/id/welcome-text', function () {
    describe('PUT /studies/id/welcome-text', function () {
      it('should return HTTP 200 if Forscher tries', async function () {
        let result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(200);
        expect(result.body.welcome_text).to.equal(studyWelcomeText);

        // Testing if the new value would be changed
        result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: anotherStudyWelcomeText,
          });
        expect(result).to.have.status(200);
        expect(result.body.welcome_text).to.equal(anotherStudyWelcomeText);
      });

      it('should return HTTP 404 if Forscher tries and study does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie123456/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(404);
      });

      it('should return HTTP 403 if Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(probandHeader1)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 if Untersuchungsteam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(utHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 if Probandmanager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(pmHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 if SysAdmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudi3/welcome-text')
          .set(sysadminHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(403);
      });
    });

    describe('GET studies/id/welcome-text', function () {
      it('should return HTTP 200 if Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/welcome-text')
          .set(probandHeader1)
          .send();
        expect(result).to.have.status(200);
        expect(result.body.welcome_text).equal(studyWelcomeText);
      });

      it('should return HTTP 200 if Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/welcome-text')
          .set(forscherHeader)
          .send();
        expect(result).to.have.status(200);
        expect(result.body.welcome_text).equal(studyWelcomeText);
      });

      it('should return HTTP 200 with sanitized welcome text', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudi2/welcome-text')
          .set(forscherHeader)
          .send();
        expect(result).to.have.status(200);
        expect(result.body.welcome_text).equal(sanitizedText);
      });

      it('should return HTTP 204 and empty response if the study welcome text does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie22/welcome-text')
          .set(probandHeader1)
          .send();
        expect(result).to.have.status(204);
        expect(result.body).to.be.empty;
      });

      it('should return HTTP 403 if Untersuchungsteam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/welcome-text')
          .set(utHeader)
          .send();
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 if Probandmanager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/welcome-text')
          .set(pmHeader)
          .send();
        expect(result).to.have.status(403);
      });

      it('should return HTTP 403 if SysAdmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/welcome-text')
          .set(sysadminHeader)
          .send();
        expect(result).to.have.status(403);
      });
    });
  });
  describe('studies/name/accesses', function () {
    describe('GET studies/name/accesses', function () {
      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses')
          .set(invalidHeader);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 200 if the study id is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/NotValidStudy/accesses')
          .set(sysadminHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_accesses.length).to.equal(0);
      });

      it('should return HTTP 404 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses')
          .set(probandHeader1);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses')
          .set(forscherHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 200 with the correct study accesses for Untersuchungsteam', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses')
          .set(utHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_accesses.length).to.equal(2);
        expect(result.body.study_accesses[0].user_id).to.equal('QTestProband1');
        expect(result.body.study_accesses[1].user_id).to.equal('QTestProband3');
        expect(result.body.study_accesses[0].role).to.equal('Proband');
        expect(result.body.study_accesses[1].role).to.equal('Proband');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses'
        );
      });

      it('should return HTTP 200 with the correct study accesses for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses')
          .set(sysadminHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_accesses.length).to.equal(3);
        expect(
          result.body.study_accesses.find(
            (access) => access.user_id === 'QTestForscher1'
          ).role
        ).to.equal('Forscher');
        expect(
          result.body.study_accesses.find(
            (access) => access.user_id === 'QTestUntersuchungsteam'
          ).role
        ).to.equal('Untersuchungsteam');
        expect(
          result.body.study_accesses.find(
            (access) => access.user_id === 'QTestProbandenManager'
          ).role
        ).to.equal('ProbandenManager');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses'
        );
      });
    });

    describe('GET studies/name/accesses/username', function () {
      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(invalidHeader);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 404 if the study id is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/NotAValidStudy/accesses/QTestProband1')
          .set(utHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the username is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/NoValidUsername')
          .set(utHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(probandHeader1);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(forscherHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProbandenManager')
          .set(pmHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the UntersuchungsTeam has no read access to study', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudi2/accesses/QTestProband2')
          .set(utHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a UntersuchungsTeam tries for a Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(utHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a SysAdmin tries for a Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(sysadminHeader);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 200 with the correct study access for UntersuchungsTeam', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(utHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestProband1');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestProband1'
        );
      });

      it('should return HTTP 200 with the correct Forscher study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestForscher1'
        );
      });

      it('should return HTTP 200 with the correct ProbandenManager study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProbandenManager')
          .set(sysadminHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestProbandenManager');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestProbandenManager'
        );
      });

      it('should return HTTP 200 with the correct Untersuchungsteam study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestUntersuchungsteam')
          .set(sysadminHeader);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestUntersuchungsteam');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestUntersuchungsteam'
        );
      });
    });

    describe('POST studies/name/accesses', function () {
      const validStudyAccess = {
        user_id: 'QTestProband2',
        access_level: 'read',
      };

      const validStudyAccessForscher = {
        user_id: 'QTestForscher1',
        access_level: 'read',
      };

      const invalidStudyAccess = {
        user_id: 'QTestProband1',
        access_level: 'somethinginvalid',
      };

      const studyAccessWrongUser = {
        user_id: 'NoValidUser',
        access_level: 'read',
      };

      const studyAccessWriteForProband = {
        user_id: 'QTestProband1',
        access_level: 'write',
      };

      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(invalidHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 400 if the payload is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(utHeader)
          .send(invalidStudyAccess);
        expect(result).to.have.status(400);
      });

      it('should return HTTP 404 if the study does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/NoValidStudy/accesses')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the user does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(utHeader)
          .send(studyAccessWrongUser);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(probandHeader1)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(forscherHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(pmHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the study access exists already', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudi2/accesses')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Proband gets access_level write', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(utHeader)
          .send(studyAccessWriteForProband);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a UntersuchungsTeam tries for Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(utHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 200 and create the study access for UntersuchungsTeam', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudie/accesses')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestProband2');
        expect(result.body.access_level).to.equal('read');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestProband2'
        );
        const result2 = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestProband2')
          .set(utHeader);
        expect(result2).to.have.status(200);
        expect(result2.body.user_id).to.equal('QTestProband2');
      });

      it('should return HTTP 200 and create the study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/ApiTestStudi2/accesses')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudi2');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('read');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudi2/accesses/QTestForscher1'
        );
        const result2 = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudi2/accesses/QTestForscher1')
          .set(sysadminHeader);
        expect(result2).to.have.status(200);
        expect(result2.body.user_id).to.equal('QTestForscher1');
      });
    });

    describe('PUT studies/name/accesses/username', function () {
      const validStudyAccess = {
        access_level: 'admin',
      };

      const invalidStudyAccess = {
        access_level: 'somethinginvalid',
      };

      const studyAccessWriteForProband = {
        access_level: 'write',
      };

      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(invalidHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(401);
      });

      it('should return HTTP 400 if the payload is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(invalidStudyAccess);
        expect(result).to.have.status(400);
      });

      it('should return HTTP 404 if the study does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/NoValidStudy/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the study access does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie3/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if the user does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/NoValidUser')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(probandHeader1)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(forscherHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(pmHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a UntersuchungsTeam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a SysAdmin tries for Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(sysadminHeader)
          .send(studyAccessWriteForProband);
        expect(result).to.have.status(404);
      });

      it('should return HTTP 200 and change the study access data for a Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('admin');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestForscher1'
        );
        const result2 = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader);
        expect(result2).to.have.status(200);
        expect(result2.body.access_level).to.equal('admin');
      });
    });

    describe('DELETE studies/name/accesses/username', function () {
      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestProband1')
          .set(invalidHeader)
          .send({});
        expect(result).to.have.status(401);
      });

      it('should return HTTP 404 if the study access does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi3/accesses/QTestProband2')
          .set(utHeader)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestProband1')
          .set(probandHeader1)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestProband1')
          .set(forscherHeader)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestProband1')
          .set(pmHeader)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a SysAdmin tries for a Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestProband1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 if a UntersuchungsTeam tries for a Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudi2/accesses/QTestForscher1')
          .set(utHeader)
          .send({});
        expect(result).to.have.status(404);
      });

      it('should return HTTP 404 and refuse to delete the study access for Untersuchungsteam', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudie/accesses/QTestProband1')
          .set(utHeader)
          .send({});
        expect(result).to.have.status(404);
        expect(result.body.message).to.equal(
          'Could not delete study accesses: Proband already answered some questionnaires or is only assigned to this study'
        );
      });

      it('should return HTTP 200 and delete the study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(200);
        expect(result.body.study_id).to.equal('ApiTestStudie');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('admin');
        expect(result.body.links.self.href).to.equal(
          '/studies/ApiTestStudie/accesses/QTestForscher1'
        );
        const result2 = await chai
          .request(apiAddress)
          .get('/studies/ApiTestStudie/accesses/QTestForscher1')
          .set(sysadminHeader);
        expect(result2).to.have.status(404);
      });
    });
  });
});

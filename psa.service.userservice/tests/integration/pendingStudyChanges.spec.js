/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const sinon = require('sinon');

const JWT = require('jsonwebtoken');
const secretOrPrivateKey = require('../secretOrPrivateKey');

const { db } = require('../../src/db');

const { Server } = require('../../src/server');
const apiAddress = 'http://localhost:' + process.env.PORT + '/user';
const suiteSandbox = sinon.createSandbox();

const testSandbox = sinon.createSandbox();
const fetch = require('node-fetch');
const { config } = require('../../src/config');
const { HttpClient } = require('@pia-system/lib-http-clients-internal');
const {
  setup,
  cleanup,
} = require('./pendingStudyChanges.spec.data/setup.helper');
const { MailService } = require('@pia/lib-service-core');
const loggingserviceUrl = config.services.loggingservice.url;

const probandSession1 = { id: 1, role: 'Proband', username: 'QTestProband1' };
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher1@example.com',
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher2@example.com',
};
const forscherSession3 = {
  id: 1,
  role: 'Forscher',
  username: 'forscherNoEmail',
};
const forscherSession4 = {
  id: 1,
  role: 'Forscher',
  username: 'forscher4@example.com',
};
const utSession1 = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'ut1@example.com',
};
const sysadminSession1 = {
  id: 1,
  role: 'SysAdmin',
  username: 'sa1@example.com',
};
const pmSession1 = {
  id: 1,
  role: 'ProbandenManager',
  username: 'pm1@example.com',
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
    await Server.init();
    suiteSandbox.stub(MailService, 'sendMail').resolves(true);
  });

  after(async function () {
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    fetchStub = testSandbox.stub(HttpClient, 'fetch');
    fetchStub.callsFake(async (url, options) => {
      console.log(url);
      let body;
      if (
        url === loggingserviceUrl + '/log/systemLogs' &&
        options.method === 'POST'
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
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    const pDValid1 = {
      requested_for: 'forscher2@example.com',
      study_id: 'QTestStudie2',
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
      requested_for: 'forscher2@example.com',
      study_id: 'QTestStudie3',
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
      requested_for: 'forscher2@example.com',
      study_id: 'QTestStudie2',
      description_to: null,
      sample_prefix_to: null,
      sample_suffix_length_to: null,
      pseudonym_prefix_to: 'LOCAL',
      pseudonym_suffix_length_to: 4,
    };

    const pDwrongFor = {
      requested_for: 'nonexisting@forscher.de',
      study_id: 'QTestStudie2',
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
      requested_for: 'forscher2@example.com',
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
      study_id: 'QTestStudie2',
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
      requested_for: 'forscher4@example.com',
      study_id: 'QTestStudie2',
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
      requested_for: 'forscher4@example.com',
      study_id: 'QTestStudie3',
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
      requested_for: 'forscher2@example.com',
      study_id: 'QTestStudie1',
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
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(probandHeader1)
        .send(pDValid1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(pmHeader1)
        .send(pDValid1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(utHeader1)
        .send(pDValid1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(sysadminHeader1)
        .send(pDValid1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 422 when a forscher tries for himself', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader2)
        .send(pDValid1);
      expect(result, result.text).to.have.status(422);
    });

    it('should return HTTP 403 when a forscher from wrong study tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader4)
        .send(pDValid1);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a forscher with wrong study access tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader4)
        .send(pDValid2);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 400 when requested_for is no email address and not create pending compliance change object', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDNoEmailFor);
      expect(result, result.text).to.have.status(400);
      db.oneOrNone('SELECT * FROM pending_study_changes WHERE study_id=$1', [
        'QTestStudie3',
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
      expect(result, result.text).to.have.status(422);
    });

    it('should return HTTP 422 when requested_for has wrong study access', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDWrongAccessToStudyForscher);
      expect(result, result.text).to.have.status(422);
    });

    it('should return HTTP 403 when target study is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDwrongStudy);
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 404 when target forscher is nonexisting', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDwrongFor);
      expect(result, result.text).to.have.status(404);
    });

    it('should return HTTP 422 when pseudonym prefix does not exist in mapping', async function () {
      pDValid2.pseudonym_prefix_to = 'None';
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDValid2);
      expect(result, result.text).to.have.status(422);
    });

    it('should return HTTP 409 when targeted study has a change request already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDConflictStudy);
      expect(result, result.text).to.have.status(409);
    });

    it('should return HTTP 200 and create pending compliance change', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/pendingstudychanges')
        .set(forscherHeader1)
        .send(pDValid1);
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal('forscher1@example.com');
      expect(result.body.requested_for).to.equal('forscher2@example.com');
      expect(result.body.study_id).to.equal('QTestStudie2');

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
        'QTestStudie2 Beschreibung'
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
      expect(result, result.text).to.have.status(200);
      expect(result.body.requested_by).to.equal('forscher1@example.com');
      expect(result.body.requested_for).to.equal('forscher2@example.com');
      expect(result.body.study_id).to.equal('QTestStudie2');

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
        'QTestStudie2 Beschreibung'
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
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a PM tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when requested_by forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader3)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 200 and change study data and post deletion log', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/pendingstudychanges/1234560')
        .set(forscherHeader2)
        .send({});
      expect(result, result.text).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'QTestStudie1',
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
      await setup();
    });

    afterEach(async function () {
      await cleanup();
    });

    it('should return HTTP 401 when the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(invalidHeader)
        .send({});
      expect(result, result.text).to.have.status(401);
    });

    it('should return HTTP 403 when a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(probandHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a pm tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(pmHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a ut tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(utHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 when a sysadmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(sysadminHeader1)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 403 wrong forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(forscherHeader3)
        .send({});
      expect(result, result.text).to.have.status(403);
    });

    it('should return HTTP 200 and cancel changing of study data for requested_by forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/pendingstudychanges/1234560')
        .set(forscherHeader1)
        .send({});
      expect(result, result.text).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'QTestStudie1',
      ]);
      const pending_study_change = await db.oneOrNone(
        'SELECT * FROM pending_study_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_study_change).to.equal(null);

      expect(study.description).to.equal('QTestStudie1 Beschreibung');
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
      expect(result, result.text).to.have.status(200);

      const study = await db.one('SELECT * FROM studies WHERE name=$1', [
        'QTestStudie1',
      ]);
      const pending_study_change = await db.oneOrNone(
        'SELECT * FROM pending_study_changes WHERE id=$1',
        [1234560]
      );

      expect(pending_study_change).to.equal(null);

      expect(study.description).to.equal('QTestStudie1 Beschreibung');
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

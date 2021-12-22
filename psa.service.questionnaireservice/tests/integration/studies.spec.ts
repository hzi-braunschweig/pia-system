/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import JWT from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { AccessToken } from '@pia/lib-service-core';
import secretOrPrivateKey from '../secretOrPrivateKey';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './studies.spec.data/setup.helper';
import { Study } from '../../src/models/study';

chai.use(chaiHttp);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/questionnaire';

const probandSession1: AccessToken = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['QTestStudy1', 'NotAValidStudy'],
};
const probandSession2: AccessToken = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband2',
  groups: ['QTestStudy2'],
};
const probandSession3: AccessToken = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband3',
  groups: ['QTestStudy3'],
};
const forscherSession: AccessToken = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['QTestStudy3', 'QTestStudy1'],
};
const forscherSession2: AccessToken = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
  groups: ['QTestStudy3', 'QTestStudy2', 'QTestStudy4'],
};
const sysadminSession: AccessToken = {
  id: 1,
  role: 'SysAdmin',
  username: 'QTestSysAdmin',
  groups: [],
};
const utSession: AccessToken = {
  id: 1,
  role: 'Untersuchungsteam',
  username: 'QTestUntersuchungsteam',
  groups: ['QTestStudy1'],
};
const pmSession: AccessToken = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: ['QTestStudy1'],
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
const probandToken3 = JWT.sign(probandSession3, secretOrPrivateKey, {
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
const probandHeader3 = { authorization: probandToken3 };
const forscherHeader = { authorization: forscherToken };
const forscherHeader2 = { authorization: forscherToken2 };
const sysadminHeader = { authorization: sysadminToken };
const utHeader = { authorization: utToken };
const pmHeader = { authorization: pmToken };

const studyContact =
  'Studienzentrum des QTestStudy1 für Infektionsforschung<br> QTestStudy1<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: QTestStudy1@QTestStudy1.de';
const studyWelcomeText =
  '# Welcome to our study! We are happy to have you with us!';
const sanitizedText = 'Welcome <img src="x"> home !';

const anotherStudyWelcomeText =
  '# Your are welcome to participate in our study!';

describe('/studies', function () {
  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  describe('GET studies', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if trying as Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studies[0].pm_email).to.be.undefined;
      expect(result.body.studies[0].hub_email).to.be.undefined;
    });

    it('should return HTTP 200 with the correct studies for Forscher', async function () {
      type StudyWithPendingStudyChange = Study & {
        pendingStudyChange: {
          study_id: string;
          requested_by: string;
          requested_for: string;
        };
      };

      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studies).to.have.length(2);
      const study1: StudyWithPendingStudyChange = (
        result.body.studies as StudyWithPendingStudyChange[]
      ).find((study: Study) => study.name === 'QTestStudy1');
      expect(study1).to.not.be.undefined;
      expect(study1.description).to.equal('QTestStudy1 Beschreibung');
      const study3: StudyWithPendingStudyChange = (
        result.body.studies as StudyWithPendingStudyChange[]
      ).find((study: Study) => study.name === 'QTestStudy3');
      expect(study3).to.not.be.undefined;
      expect(study3.description).to.equal('QTestStudy3 Beschreibung');
      expect(study3.pendingStudyChange).to.not.equal(undefined);
      expect(study3.pendingStudyChange.study_id).to.equal('QTestStudy3');
      expect(study3.pendingStudyChange.requested_by).to.equal('QTestForscher1');
      expect(study3.pendingStudyChange.requested_for).to.equal(
        'QTestForscher2'
      );

      expect(result.body.links.self.href).to.equal('/studies');
    });

    it('should return HTTP 200 with the correct studies for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studies.length).to.equal(1);
      expect(result.body.studies[0].name).to.equal('QTestStudy1');
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
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studies.length).to.equal(1);
      expect(result.body.studies[0].name).to.equal('QTestStudy1');
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
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.studies).to.have.length(3);
      expect(result.body.links.self.href).to.equal('/studies');
    });
  });

  describe('GET studies/id', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the study id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/NotAValidStudy')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the Proband has no access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the Forscher has no access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy2')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy1');
      expect(result.body.pm_email).to.equal(undefined);
      expect(result.body.hub_email).to.equal(undefined);
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy1');
    });

    it('should return HTTP 200 with the correct study for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy1');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy1');
    });

    it('should return HTTP 200 with the correct study for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy1');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy1');
    });

    it('should return HTTP 200 with the correct study for ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy1');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy1');
    });

    it('should return HTTP 200 with the correct study for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy1')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy1');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(false);
      expect(result.body.sample_prefix).to.equal('TESTPREFIX');
      expect(result.body.sample_suffix_length).to.equal(5);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy1');
    });
  });

  describe('GET studies/addresses', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the Forscher tries ', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(utHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the Probandenmanager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(pmHeader);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the correct study for Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/studies/addresses')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].address).to.equal(studyContact);
      expect(result.body[0].name).to.equal('QTestStudy1');
    });
  });

  describe('POST studies', function () {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(invalidHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy1',
        });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(probandHeader1)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(forscherHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(utHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(pmHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the study name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 400 if the email is not valid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'QTestStudy1 Beschreibung',
          pm_email: 'pmpmpm',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 200 and create the study for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'QTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('NewQTestStudy1');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/NewQTestStudy1');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewQTestStudy1')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy1');
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty pm email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy2',
          description: 'QTestStudy1 Beschreibung',
          pm_email: null,
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('NewQTestStudy2');
      expect(result.body.pm_email).to.equal(null);
      expect(result.body.hub_email).to.equal('hub@pia.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/NewQTestStudy2');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewQTestStudy2')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy2');
      expect(result2.body.pm_email).to.equal(null);
      expect(result2.body.hub_email).to.equal('hub@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty hub email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy3',
          description: 'QTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: null,
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('NewQTestStudy3');
      expect(result.body.pm_email).to.equal('pm@pia.de');
      expect(result.body.hub_email).to.equal(null);
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/NewQTestStudy3');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/NewQTestStudy3')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy3');
      expect(result2.body.hub_email).to.equal(null);
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });
  });

  describe('PUT studies/id', function () {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(invalidHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy3Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
          has_rna_samples: false,
          sample_prefix: 'TESTPREFIXEDIT',
          sample_suffix_length: 6,
        });
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(sysadminHeader)
        .send({ name: 'QTestStudy1' });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 404 if the study does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/NotAValidStudy')
        .set(sysadminHeader)
        .send({
          name: 'NotAValidStudy',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(probandHeader1)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(utHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(pmHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(forscherHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the new name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(sysadminHeader)
        .send({
          name: 'QTestStudy2',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the study name changes for a study that has users assigned to it', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy1')
        .set(sysadminHeader)
        .send({
          name: 'QTestStudy1Changed',
          description: 'QTestStudy2Changed Beschreibung Changed',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and change only fields a sysadmin is allowed to change', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/studies/QTestStudy2')
        .set(sysadminHeader)
        .send({
          name: 'QTestStudy2',
          description: 'QTestStudy2 Beschreibung Changed2',
          pm_email: 'pm@pia2.de',
          hub_email: 'hub@pia2.de',
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.name).to.equal('QTestStudy2');
      expect(result.body.description).to.equal(
        'QTestStudy2 Beschreibung Changed2'
      );
      expect(result.body.pm_email).to.equal('pm@pia2.de');
      expect(result.body.hub_email).to.equal('hub@pia2.de');
      expect(result.body.has_rna_samples).to.equal(true);
      expect(result.body.sample_prefix).to.equal('ZIFCO');
      expect(result.body.sample_suffix_length).to.equal(10);
      expect(result.body.has_answers_notify_feature).to.equal(false);
      expect(result.body.has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body.has_logging_opt_in).to.equal(false);
      expect(result.body.links.self.href).to.equal('/studies/QTestStudy2');
      const result2 = await chai
        .request(apiAddress)
        .get('/studies/QTestStudy2')
        .set(forscherHeader2);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('QTestStudy2');
      expect(result2.body.description).to.equal(
        'QTestStudy2 Beschreibung Changed2'
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
      beforeEach(async () => {
        await setup();
      });

      afterEach(async () => {
        await cleanup();
      });

      it('should return HTTP 200 if Forscher tries', async function () {
        let result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.welcome_text).to.equal(studyWelcomeText);

        // Testing if the new value would be changed
        result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: anotherStudyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.welcome_text).to.equal(anotherStudyWelcomeText);
      });

      it('should return HTTP 403 if Forscher tries and has no access to study', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy2/welcome-text')
          .set(forscherHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(probandHeader1)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if Proband tries and has no access to study', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy2/welcome-text')
          .set(probandHeader1)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if Untersuchungsteam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(utHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if Probandmanager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(pmHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if SysAdmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/welcome-text')
          .set(sysadminHeader)
          .send({
            welcome_text: studyWelcomeText,
          });
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });
    });

    describe('GET studies/id/welcome-text', function () {
      before(async () => {
        await setup();
      });

      after(async () => {
        await cleanup();
      });

      it('should return HTTP 200 if Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/welcome-text')
          .set(probandHeader1)
          .send();
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.welcome_text).equal(studyWelcomeText);
      });

      it('should return HTTP 403 if Proband tries and has no access study', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy2/welcome-text')
          .set(probandHeader1)
          .send();
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 200 if Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/welcome-text')
          .set(forscherHeader)
          .send();
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.welcome_text).equal(studyWelcomeText);
      });

      it('should return HTTP 403 if Forscher tries and has no access study', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy2/welcome-text')
          .set(forscherHeader)
          .send();
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 200 with sanitized welcome text', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy2/welcome-text')
          .set(probandHeader2)
          .send();
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.welcome_text).equal(sanitizedText);
      });

      it('should return HTTP 204 and empty response if the study welcome text does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy3/welcome-text')
          .set(probandHeader3)
          .send();
        expect(result).to.have.status(StatusCodes.NO_CONTENT);
        expect(result.body).to.be.empty;
      });

      it('should return HTTP 403 if Untersuchungsteam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/welcome-text')
          .set(utHeader)
          .send();
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if Probandmanager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/welcome-text')
          .set(pmHeader)
          .send();
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if SysAdmin tries', async function () {
        const result = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/welcome-text')
          .set(sysadminHeader)
          .send();
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });
    });
  });

  describe('studies/name/accesses', function () {
    describe('POST studies/name/accesses', function () {
      beforeEach(async () => {
        await setup();
      });

      afterEach(async () => {
        await cleanup();
      });

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

      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(invalidHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      });

      it('should return HTTP 400 if the payload is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(sysadminHeader)
          .send(invalidStudyAccess);
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should return HTTP 404 if the study does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/NoValidStudy/accesses')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 404 if the user does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(sysadminHeader)
          .send(studyAccessWrongUser);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 403 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(probandHeader1)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(forscherHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(pmHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 200 and create the study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy2/accesses')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.study_id).to.equal('QTestStudy2');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('read');
        expect(result.body.links.self.href).to.equal(
          '/studies/QTestStudy2/accesses/QTestForscher1'
        );
      });

      it('should return HTTP 404 if the study access exists already', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 409 if SysAdmin tries to update a Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .post('/studies/QTestStudy1/accesses')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.CONFLICT);
      });
    });

    describe('PUT studies/name/accesses/username', function () {
      beforeEach(async () => {
        await setup();
      });

      afterEach(async () => {
        await cleanup();
      });

      const validStudyAccess = {
        access_level: 'admin',
      };

      const validStudyAccessForscher = {
        access_level: 'read',
      };

      const invalidStudyAccess = {
        access_level: 'somethinginvalid',
      };

      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(invalidHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      });

      it('should return HTTP 400 if the payload is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(invalidStudyAccess);
        expect(result).to.have.status(StatusCodes.BAD_REQUEST);
      });

      it('should return HTTP 404 if the study does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/NoValidStudy/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 404 if the study access does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy2/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccessForscher);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 404 if the user does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/NoValidUser')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 403 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(probandHeader1)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(forscherHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(pmHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a UntersuchungsTeam tries', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(utHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 409 if a SysAdmin tries for Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestProband1')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.CONFLICT);
      });

      it('should return HTTP 200 and change the study access data for a Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .put('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send(validStudyAccess);
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.study_id).to.equal('QTestStudy1');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('admin');
        expect(result.body.links.self.href).to.equal(
          '/studies/QTestStudy1/accesses/QTestForscher1'
        );
      });
    });

    describe('DELETE studies/name/accesses/username', function () {
      beforeEach(async () => {
        await setup();
      });

      afterEach(async () => {
        await cleanup();
      });

      it('should return HTTP 401 if the token is wrong', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestProband1')
          .set(invalidHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
      });

      it('should return HTTP 404 if the study access does not exist', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.NOT_FOUND);
      });

      it('should return HTTP 403 if a Proband tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestProband1')
          .set(probandHeader1)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a Forscher tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestProband1')
          .set(forscherHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 if a ProbandenManager tries', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestProband1')
          .set(pmHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 409 if a SysAdmin tries for a Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestProband1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.CONFLICT);
      });

      it('should return HTTP 403 if a UntersuchungsTeam tries for a Forscher', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy2/accesses/QTestForscher1')
          .set(utHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 403 and refuse to delete the study access for Untersuchungsteam', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy1/accesses/QTestProband1')
          .set(utHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.FORBIDDEN);
      });

      it('should return HTTP 409 if SysAdmin tries to delete study access for a Proband', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy1/accesses/QTestProband1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.CONFLICT);
      });

      it('should return HTTP 200 and delete the study access for SysAdmin', async function () {
        const result = await chai
          .request(apiAddress)
          .delete('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(sysadminHeader)
          .send({});
        expect(result).to.have.status(StatusCodes.OK);
        expect(result.body.study_id).to.equal('QTestStudy1');
        expect(result.body.user_id).to.equal('QTestForscher1');
        expect(result.body.access_level).to.equal('write');
        expect(result.body.links.self.href).to.equal(
          '/studies/QTestStudy1/accesses/QTestForscher1'
        );
        const result2 = await chai
          .request(apiAddress)
          .get('/studies/QTestStudy1/accesses/QTestForscher1')
          .set(sysadminHeader);
        expect(result2).to.have.status(StatusCodes.NOT_FOUND);
      });
    });
  });
});

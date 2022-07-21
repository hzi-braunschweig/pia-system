/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { cleanup, setup } from './studies.spec.data/setup.helper';
import { Study } from '../../src/models/study';
import {
  probandAuthClient,
  adminAuthClient,
} from '../../src/clients/authServerClient';
import sinon from 'sinon';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['QTestStudy1'],
});
const forscherHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['QTestStudy3', 'QTestStudy1'],
});
const forscherHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher2',
  studies: ['QTestStudy3', 'QTestStudy2', 'QTestStudy4'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const utHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'qtest-untersuchungsteam',
  studies: ['QTestStudy1'],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['QTestStudy1'],
});

const studyWelcomeText =
  '# Welcome to our study! We are happy to have you with us!';

const anotherStudyWelcomeText =
  '# Your are welcome to participate in our study!';

describe('/studies', function () {
  const sandbox = sinon.createSandbox();

  before(async function () {
    await Server.init();

    sandbox.stub(probandAuthClient);
    sandbox.stub(adminAuthClient);
    sandbox.stub(probandAuthClient.groups);
    sandbox.stub(adminAuthClient.groups);
  });

  after(async function () {
    sandbox.restore();

    await Server.stop();
  });

  beforeEach(() => {
    AuthServerMock.adminRealm().returnValid();
    AuthServerMock.probandRealm().returnValid();
  });

  afterEach(AuthServerMock.cleanAll);

  describe('GET /admin/studies', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 403 if trying as Proband', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
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
        .get('/admin/studies')
        .set(forscherHeader);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(2);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const study1: StudyWithPendingStudyChange = (
        result.body as StudyWithPendingStudyChange[]
      ).find((study: Study) => study.name === 'QTestStudy1');
      expect(study1).to.not.be.undefined;
      expect(study1.description).to.equal('QTestStudy1 Beschreibung');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const study3: StudyWithPendingStudyChange = (
        result.body as StudyWithPendingStudyChange[]
      ).find((study: Study) => study.name === 'QTestStudy3');
      expect(study3).to.not.be.undefined;
      expect(study3.description).to.equal('QTestStudy3 Beschreibung');
      expect(study3.pendingStudyChange).to.not.equal(undefined);
      expect(study3.pendingStudyChange.study_id).to.equal('QTestStudy3');
      expect(study3.pendingStudyChange.requested_by).to.equal(
        'qtest-forscher1'
      );
      expect(study3.pendingStudyChange.requested_for).to.equal(
        'qtest-forscher2'
      );
    });

    it('should return HTTP 200 with the correct studies for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies')
        .set(utHeader);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].name).to.equal('QTestStudy1');
      expect(result.body[0].pm_email).to.equal('pm@pia.de');
      expect(result.body[0].hub_email).to.equal('hub@pia.de');
      expect(result.body[0].has_rna_samples).to.equal(false);
      expect(result.body[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body[0].sample_suffix_length).to.equal(5);
      expect(result.body[0].has_answers_notify_feature).to.equal(false);
      expect(result.body[0].has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body[0].has_logging_opt_in).to.equal(false);
    });

    it('should return HTTP 200 with the correct studies for ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies')
        .set(pmHeader);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.length).to.equal(1);
      expect(result.body[0].name).to.equal('QTestStudy1');
      expect(result.body[0].pm_email).to.equal('pm@pia.de');
      expect(result.body[0].hub_email).to.equal('hub@pia.de');
      expect(result.body[0].has_rna_samples).to.equal(false);
      expect(result.body[0].sample_prefix).to.equal('TESTPREFIX');
      expect(result.body[0].sample_suffix_length).to.equal(5);
      expect(result.body[0].has_answers_notify_feature).to.equal(false);
      expect(result.body[0].has_answers_notify_feature_by_mail).to.equal(false);
      expect(result.body[0].has_logging_opt_in).to.equal(false);
    });

    it('should return HTTP 200 with the correct studies for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies')
        .set(sysadminHeader);

      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(3);
    });
  });

  describe('GET /admin/studies/{studyName}', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 403 if the Forscher has no access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy2')
        .set(forscherHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct study for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1')
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
    });

    it('should return HTTP 200 with the correct study for Untersuchungsteam', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1')
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
    });

    it('should return HTTP 200 with the correct study for ProbandenManager', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1')
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
    });

    it('should return HTTP 200 with the correct study for SysAdmin', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1')
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
    });
  });

  describe('POST /admin/studies', function () {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
        .set(sysadminHeader)
        .send({
          name: 'NewQTestStudy1',
        });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
        .set(forscherHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
        .set(utHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
        .set(pmHeader)
        .send({
          name: 'NewQTestStudy1',
          description: 'NewQTestStudy1 Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the study name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
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
        .post('/admin/studies')
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
        .post('/admin/studies')
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

      AuthServerMock.adminRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/admin/studies/NewQTestStudy1')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy1');
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty pm email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
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

      AuthServerMock.adminRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/admin/studies/NewQTestStudy2')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy2');
      expect(result2.body.pm_email).to.equal(null);
      expect(result2.body.hub_email).to.equal('hub@pia.de');
    });

    it('should return HTTP 200 and create the study for SysAdmin with empty hub email', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/admin/studies')
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

      AuthServerMock.adminRealm().returnValid();

      const result2 = await chai
        .request(apiAddress)
        .get('/admin/studies/NewQTestStudy3')
        .set(sysadminHeader);
      expect(result2).to.have.status(StatusCodes.OK);
      expect(result2.body.name).to.equal('NewQTestStudy3');
      expect(result2.body.hub_email).to.equal(null);
      expect(result2.body.pm_email).to.equal('pm@pia.de');
    });
  });

  describe('PUT /admin/studies/{studyName}', function () {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 400 if the payload is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
        .set(sysadminHeader)
        .send({ name: 'QTestStudy1' });
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 404 if the study does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/NotAValidStudy')
        .set(sysadminHeader)
        .send({
          name: 'NotAValidStudy',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
        .set(probandHeader1)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
        .set(utHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a ProbandenManager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
        .set(pmHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
        .set(forscherHeader)
        .send({
          name: 'QTestStudy1',
          description: 'QTestStudy1Changed Beschreibung',
          pm_email: 'pm@pia.de',
          hub_email: 'hub@pia.de',
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the new name exists already', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1')
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
        .put('/admin/studies/QTestStudy1')
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
        .put('/admin/studies/QTestStudy2')
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

      AuthServerMock.adminRealm().returnValid();
      const result2 = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy2')
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

  describe('PUT /admin/studies/{studyName}/welcome-text', function () {
    beforeEach(async () => {
      await setup();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('should return HTTP 200 if Forscher tries', async function () {
      let result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
        .set(forscherHeader)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.welcome_text).to.equal(studyWelcomeText);

      AuthServerMock.adminRealm().returnValid();

      // Testing if the new value would be changed
      result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
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
        .put('/admin/studies/QTestStudy2/welcome-text')
        .set(forscherHeader)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
        .set(probandHeader1)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Proband tries and has no access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy2/welcome-text')
        .set(probandHeader1)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
        .set(utHeader)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Probandmanager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
        .set(pmHeader)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/admin/studies/QTestStudy1/welcome-text')
        .set(sysadminHeader)
        .send({
          welcome_text: studyWelcomeText,
        });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });

  describe('GET /admin/studies/{studyName}/welcome-text', function () {
    before(async () => {
      await setup();
    });

    after(async () => {
      await cleanup();
    });

    it('should return HTTP 200 if Forscher tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1/welcome-text')
        .set(forscherHeader)
        .send();
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body.welcome_text).equal(studyWelcomeText);
    });

    it('should return HTTP 403 if Forscher tries and has no access study', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy2/welcome-text')
        .set(forscherHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Untersuchungsteam tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1/welcome-text')
        .set(utHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if Probandmanager tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1/welcome-text')
        .set(pmHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if SysAdmin tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/admin/studies/QTestStudy1/welcome-text')
        .set(sysadminHeader)
        .send();
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });
  });
});

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';

import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { cleanup, setup } from './probandsToContact.spec.data/setup.helper';
import { ProbandToContactDto } from '../../../src/models/probandsToContact';
import { mockGetProbandAccountsByStudyName } from '../accountServiceRequestMock.helper.spec';
import sinon from 'sinon';
import assert from 'assert';
import { db } from '../../../src/db';

chai.use(chaiHttp);

const apiAddress = `http://localhost:${config.public.port}`;

const probandHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Proband'],
  username: 'qtest-proband1',
  studies: ['ApiTestStudie'],
});
const forscherHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Forscher'],
  username: 'qtest-forscher1',
  studies: ['ApiTestStudie', 'ApiTestStudie2', 'ApiTestMultiProf'],
});
const utHeader1 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['Untersuchungsteam'],
  username: 'ut@apitest.de',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});
const sysadminHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['SysAdmin'],
  username: 'qtest-sysadmin',
  studies: [],
});
const pmHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestStudie', 'ApiTestMultiProf'],
});
const pmHeader2 = AuthTokenMockBuilder.createAuthHeader({
  roles: ['ProbandenManager'],
  username: 'qtest-probandenmanager',
  studies: ['ApiTestStudie2'],
});

describe('/admin/probandstocontact', () => {
  const sandbox = sinon.createSandbox();

  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();
    AuthServerMock.adminRealm().returnValid();
  });

  afterEach(async () => {
    await cleanup();
    AuthServerMock.cleanAll();
    sandbox.restore();
  });

  describe('GET /admin/probandstocontact', () => {
    it('should return HTTP 403 if a Proband tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a UT tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(utHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a Forscher tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if a SysAdmin tries', async () => {
      const result = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(sysadminHeader);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with active probands to contact for PM', async () => {
      // Arrange
      const expectedResultLength = 2;
      mockGetProbandAccountsByStudyName(
        sandbox,
        ['ApiTestStudie', 'ApiTestMultiProf'],
        ['qtest-proband1']
      );

      // Act
      const result: Response<ProbandToContactDto[]> = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(pmHeader);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultLength);

      assert(result.body[0]);
      expect(result.body[0].id).to.equal(1);
      expect(result.body[0].user_id).to.equal('qtest-proband1');
      expect(result.body[0].accountStatus).to.equal('account');

      assert(result.body[1]);
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      expect(result.body[1].id).to.equal(4);
      expect(result.body[1].user_id).to.equal('qtest-proband4');
      expect(result.body[1].accountStatus).to.equal('no_account');
    });

    it('should return HTTP 200 with active probands to contact for PM and questionnaire names with notable answers', async () => {
      // Arrange
      const expectedResultLength = 1;
      const expectedNotableAnswersLength = 3;
      const expectedId = 2;
      const arrayIndex2 = 2;
      mockGetProbandAccountsByStudyName(
        sandbox,
        ['ApiTestStudie2'],
        ['qtest-proband2']
      );

      // Act
      const result: Response<ProbandToContactDto[]> = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(pmHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultLength);

      assert(result.body[0]);
      expect(
        result.body[0].notable_answer_questionnaire_instances
      ).to.have.length(expectedNotableAnswersLength);
      assert(result.body[0].notable_answer_questionnaire_instances[0]);
      assert(result.body[0].notable_answer_questionnaire_instances[1]);
      assert(
        // eslint-disable-next-line security/detect-object-injection
        result.body[0].notable_answer_questionnaire_instances[arrayIndex2]
      );

      expect(result.body[0].id).to.equal(expectedId);
      expect(result.body[0].user_id).to.equal('qtest-proband2');
      expect(
        result.body[0].notable_answer_questionnaire_instances[0]
          .questionnaire_name
      ).to.equal('ApiQuestionnaireName1');
      expect(
        result.body[0].notable_answer_questionnaire_instances[1]
          .questionnaire_name
      ).to.equal('ApiQuestionnaireName2');
      expect(
        // eslint-disable-next-line security/detect-object-injection
        result.body[0].notable_answer_questionnaire_instances[arrayIndex2]
          .questionnaire_name
      ).to.equal('ApiQuestionnaireName3');
    });

    it('should return HTTP 200 with active probands to contact for PM and questionnaire names which are not filled out', async () => {
      // Arrange
      const expectedResultLength = 1;
      const expectedId = 2;
      mockGetProbandAccountsByStudyName(
        sandbox,
        ['ApiTestStudie2'],
        ['qtest-proband2']
      );

      // Act
      const result: Response<ProbandToContactDto[]> = await chai
        .request(apiAddress)
        .get('/admin/probandstocontact')
        .set(pmHeader2);

      // Assert
      expect(result).to.have.status(StatusCodes.OK);
      expect(result.body).to.have.length(expectedResultLength);

      assert(result.body[0]);
      expect(
        result.body[0].not_filledout_questionnaire_instances
      ).to.have.length(1);
      assert(result.body[0].not_filledout_questionnaire_instances[0]);

      expect(result.body[0].id).to.equal(expectedId);
      expect(result.body[0].user_id).to.equal('qtest-proband2');
      expect(
        result.body[0].not_filledout_questionnaire_instances[0]
          .questionnaire_name
      ).to.equal('ApiQuestionnaireName4');
    });
    it('should return HTTP 204 and update Proband processed Status', async () => {
      // Act
      const result: Response<ProbandToContactDto> = await chai
        .request(apiAddress)
        .put('/admin/probandstocontact/3')
        .set(pmHeader2)
        .send({ processed: true });

      // Assert
      const probandToContact: ProbandToContactDto = await db.one(
        'SELECT processed FROM users_to_contact WHERE id=3'
      );
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(probandToContact.processed).to.equal(true);
    });
  });
});

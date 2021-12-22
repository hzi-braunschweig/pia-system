/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import sinon, { SinonSpy } from 'sinon';
import fetchMocker from 'fetch-mock';
import {
  CreateAccountRequestInternalDto,
  HttpClient,
} from '@pia-system/lib-http-clients-internal';
import { cleanup, setup } from './internal-postProband.spec.data/setup.helper';
import { db } from '../../src/db';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { authserviceClient } from '../../src/clients/authserviceClient';
import {
  CreateProbandRequest,
  CreateProbandResponse,
} from '../../src/models/proband';
import { Response } from './instance.helper.spec';

chai.use(chaiHttp);
chai.use(sinonChai);

const fetchMock = fetchMocker.sandbox();
const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: post proband', function () {
  let createUserSpy: SinonSpy;

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(async function () {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
    fetchMock.post('express:/auth/user', async (_url, opts) => {
      const user = JSON.parse(
        opts.body as string
      ) as CreateAccountRequestInternalDto;
      try {
        await db.none(
          "INSERT INTO accounts (username, password, role) VALUES ($(username), 'hashed_password', $(role))",
          user
        );
        return {
          body: null,
        };
      } catch (e) {
        return StatusCodes.CONFLICT;
      }
    });
    createUserSpy = testSandbox.spy(authserviceClient, 'createAccount');
    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('POST /user/studies/{studyName}/probands', function () {
    it('should return 409 if pseudonym is already in use', async function () {
      // Arrange
      const body = createProbandRequest({ ids: 'exists' });
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.CONFLICT);
      expect(createUserSpy.notCalled).to.be.true;
    });

    it('should return 409 if IDS is already in use', async function () {
      // Arrange
      const body = createProbandRequest({ pseudonym: 'QTestProband2' });
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.CONFLICT);
      expect(createUserSpy.notCalled).to.be.true;
    });

    it('should return 428 if study does not exist', async function () {
      // Arrange
      const body = createProbandRequest();
      const studyName = 'NoStudy';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.PRECONDITION_REQUIRED);
      expect(createUserSpy.notCalled).to.be.true;
    });

    it('should create a user with a random password', async () => {
      // Arrange
      const body = createProbandRequest();
      const studyName = 'QTestStudy1';

      // Act
      const result: Response<CreateProbandResponse> = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(createUserSpy).to.be.calledOnce;
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.password).to.be.a('string');
      expect(result.body.password.length).to.equal(config.userPasswordLength);
      expect(result.body.pseudonym).to.equal(body.pseudonym);
    });

    it('should update proband and return 200', async () => {
      // Arrange
      const body = createProbandRequest({ ids: 'doesnotexist' });
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);
      const proband: Partial<CreateProbandResponse> | null = await db.oneOrNone(
        `
          SELECT compliance_labresults,
                 compliance_samples,
                 compliance_bloodsamples,
                 study_center,
                 examination_wave,
                 ids
          FROM probands WHERE pseudonym=$(pseudonym)`,
        body
      );

      // Assert
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(proband).to.deep.equal({
        compliance_labresults: false,
        compliance_samples: false,
        compliance_bloodsamples: false,
        study_center: null,
        examination_wave: null,
        ids: 'doesnotexist',
      });
    });

    function createProbandRequest(
      proband: Partial<CreateProbandRequest> = {}
    ): CreateProbandRequest {
      return {
        pseudonym: 'QTestProband3',
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        ...proband,
      };
    }
  });
});

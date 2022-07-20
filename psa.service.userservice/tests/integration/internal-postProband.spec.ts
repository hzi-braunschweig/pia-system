/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import sinonChai from 'sinon-chai';
import { StatusCodes } from 'http-status-codes';
import sinon, { SinonStub, SinonStubbedInstance } from 'sinon';
import { cleanup, setup } from './internal-postProband.spec.data/setup.helper';
import { db } from '../../src/db';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import {
  CreateProbandRequest,
  CreateProbandResponse,
} from '../../src/models/proband';
import { Response } from '@pia/lib-service-core';
import { probandAuthClient } from '../../src/clients/authServerClient';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';

chai.use(chaiHttp);
chai.use(sinonChai);

const serverSandbox = sinon.createSandbox();
const testSandbox = sinon.createSandbox();

const internalApiAddress = `http://localhost:${config.internal.port}`;

describe('Internal: post proband', function () {
  let authClientUsersStub: SinonStubbedInstance<Users>;
  let authClientGroupsStub: SinonStub;
  let authClientRolesStub: SinonStub;

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    serverSandbox.restore();
  });

  beforeEach(async function () {
    authClientUsersStub = testSandbox.stub(probandAuthClient.users);
    authClientUsersStub.create.resolves({ id: '1234' });
    authClientUsersStub.addClientRoleMappings.resolves();

    authClientGroupsStub = testSandbox.stub(probandAuthClient.groups, 'find');
    authClientGroupsStub.resolves([
      {
        id: 'xyz',
        name: 'QTestStudy1',
        path: '/QTestStudy1',
      },
    ]);
    authClientRolesStub = testSandbox.stub(
      probandAuthClient.roles,
      'findOneByName'
    );
    authClientRolesStub.resolves({
      id: 'abc-123',
      name: 'Proband',
    });

    await setup();
  });

  afterEach(async function () {
    await cleanup();
    testSandbox.restore();
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
      expect(authClientUsersStub.create.notCalled).to.be.true;
    });

    it('should return 409 if IDS is already in use', async function () {
      // Arrange
      const body = createProbandRequest({ pseudonym: 'qtest-proband2' });
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.CONFLICT);
      expect(authClientUsersStub.create.notCalled).to.be.true;
    });

    it('should return 428 if study does not exist in DB', async function () {
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
      expect(authClientUsersStub.create.notCalled).to.be.true;
    });

    it('should return 428 if study does not exist in authserver', async function () {
      // Arrange
      const body = createProbandRequest();
      const studyName = 'QTestStudy1';
      authClientGroupsStub.resolves([]);

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.PRECONDITION_REQUIRED);
      expect(authClientUsersStub.create.notCalled).to.be.true;
    });

    it('should return 500 if role does not exist in authserver', async function () {
      // Arrange
      const body = createProbandRequest();
      const studyName = 'QTestStudy1';
      authClientRolesStub.resolves(undefined);

      // Act
      const result = await chai
        .request(internalApiAddress)
        .post(`/user/studies/${studyName}/probands`)
        .send(body);

      // Assert
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(authClientUsersStub.create.notCalled).to.be.true;
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
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.password).to.be.a('string');
      expect(result.body.password.length).to.equal(config.userPasswordLength);
      expect(result.body.pseudonym).to.equal(body.pseudonym);

      expect(authClientUsersStub.create).to.be.calledOnceWith({
        realm: 'pia-proband-realm',
        username: 'qtest-proband3',
        groups: ['/QTestStudy1'],
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: result.body.password,
            temporary: true,
          },
        ],
      });
      expect(authClientUsersStub.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-proband-realm',
        roles: [{ id: 'abc-123', name: 'Proband' }],
      });
    });

    it('should create the proband and return 200', async () => {
      // Arrange
      const body = createProbandRequest({ ids: 'doesnotexist' });
      const studyName = 'QTestStudy1';

      // Act
      const result: Response<CreateProbandResponse> = await chai
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

      expect(authClientUsersStub.create).to.be.calledOnceWith({
        realm: 'pia-proband-realm',
        username: 'qtest-proband3',
        groups: ['/QTestStudy1'],
        enabled: true,
        credentials: [
          {
            type: 'password',
            value: result.body.password,
            temporary: true,
          },
        ],
      });
      expect(authClientUsersStub.addRealmRoleMappings).to.be.calledOnceWith({
        id: '1234',
        realm: 'pia-proband-realm',
        roles: [{ id: 'abc-123', name: 'Proband' }],
      });
    });

    function createProbandRequest(
      proband: Partial<CreateProbandRequest> = {}
    ): CreateProbandRequest {
      return {
        pseudonym: 'qtest-proband3',
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        ...proband,
      };
    }
  });
});

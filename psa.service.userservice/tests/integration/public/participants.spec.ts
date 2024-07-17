/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon, { createSandbox, SinonStubbedInstance } from 'sinon';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
} from '@pia/lib-messagequeue';
import {
  AuthServerMock,
  AuthTokenMockBuilder,
  Response,
} from '@pia/lib-service-core';
import { Server } from '../../../src/server';
import { config } from '../../../src/config';
import { cleanup, setup } from './participants.spec.data/setup.helper';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { probandAuthClient } from '../../../src/clients/authServerClient';
import {
  mockGetProbandAccount,
  mockGetProbandAccountsByStudyName,
} from '../accountServiceRequestMock.helper.spec';
import {
  CreateParticipantRequestDto,
  CreateParticipantResponseDto,
  ParticipantDto,
} from '../../../src/models/participant';
import { getRepository } from 'typeorm';
import { Proband } from '../../../src/entities/proband';

chai.use(chaiHttp);

const apiClientHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: [],
  username: '',
  studies: ['QTestStudy1', 'QTestStudy3', 'DoesNotExist'],
});

const apiAddress = `http://localhost:${config.public.port}`;

describe('/public/studies/{studyName}/participants', () => {
  const testSandbox = createSandbox();
  const suiteSandbox = sinon.createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    await Server.init();
    await mqc.connect(true);
    await mqc.createConsumer(MessageQueueTopic.PROBAND_CREATED, async () => {
      return Promise.resolve();
    });
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
    suiteSandbox.restore();
  });

  beforeEach(async function () {
    AuthServerMock.adminRealm().returnValid();
    await setup();
  });

  afterEach(async function () {
    AuthServerMock.cleanAll();
    await cleanup();
    testSandbox.restore();
  });

  describe('GET /public/studies/{studyName}/participants', () => {
    beforeEach(() =>
      mockGetProbandAccountsByStudyName(
        testSandbox,
        ['QTestStudy1'],
        ['test01-1111', 'qtest-2222', 'qtest-3333']
      )
    );

    it('should return 401 if no auth token is appended', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if API client does not have study access', async () => {
      // Arrange
      const studyName = 'QTestStudy2';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return a list of the participants of the study', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);

      const expectedParticipantCount = 2;
      expect(response.body).to.have.length(expectedParticipantCount);

      const proband1 = response.body.find((p) => p.pseudonym === 'test01-1111');
      expect(proband1).to.deep.equal({
        pseudonym: 'test01-1111',
        ids: null,
        study: 'QTestStudy1',
        status: 'active',
        accountStatus: 'account',
        studyCenter: null,
        examinationWave: 1,
        firstLoggedInAt: null,
        deactivatedAt: null,
        deletedAt: null,
        isTestParticipant: false,
      });

      const proband2 = response.body.find((p) => p.pseudonym === 'qtest-4444');
      expect(proband2).to.deep.equal({
        pseudonym: 'qtest-4444',
        ids: null,
        status: 'active',
        accountStatus: 'no_account',
        studyCenter: null,
        examinationWave: 1,
        firstLoggedInAt: null,
        deactivatedAt: null,
        deletedAt: null,
        study: 'QTestStudy1',
        isTestParticipant: false,
      });
    });
  });

  describe('GET /public/studies/{studyName}/participants/{pseudonym}', () => {
    beforeEach(() =>
      mockGetProbandAccount(testSandbox, 'test01-1111', 'QTestStudy1')
    );

    it('should return 401 if no auth token is appended', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants/test01-1111`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if API client does not have study access', async () => {
      // Arrange
      const studyName = 'QTestStudy2';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 404 if participant was not found', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants/qtest-9999`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return the participant', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .get(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal({
        pseudonym: 'test01-1111',
        ids: null,
        study: 'QTestStudy1',
        status: 'active',
        accountStatus: 'account',
        studyCenter: null,
        examinationWave: 1,
        firstLoggedInAt: null,
        deactivatedAt: null,
        deletedAt: null,
        isTestParticipant: false,
      });
    });
  });

  describe('POST /public/studies/{studyName}/participants', () => {
    let authClientUsersMock: SinonStubbedInstance<Users>;

    beforeEach(function () {
      authClientUsersMock = testSandbox.stub(probandAuthClient.users);
      authClientUsersMock.create.resolves({ id: '1234' });
      authClientUsersMock.addClientRoleMappings.resolves();

      testSandbox.stub(probandAuthClient.groups, 'find').resolves([
        {
          id: 'xyz',
          name: 'QTestStudy1',
          path: '/QTestStudy1',
        },
      ]);
      testSandbox.stub(probandAuthClient.roles, 'findOneByName').resolves({
        id: 'abc-123',
        name: 'Proband',
      });
    });

    it('should return 401 if no auth token is appended', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .send(createParticipantRequest({ pseudonym: 'qtest-0001' }));

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym: 'qtest-0001' }));

      // Assert
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if API client does not have study access', async function () {
      // Arrange
      const studyName = 'QTestStudy2';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym: 'qtest-0001' }));

      // Assert
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 404 if the study does not exist', async function () {
      // Arrange
      const studyName = 'DoesNotExist';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym: 'qtest-0001' }));

      // Assert
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return 409 if proband already exists', async function () {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym: 'test01-1111' }));

      // Assert
      expect(result).to.have.status(StatusCodes.CONFLICT);
    });

    it('should return 500 if creating the account fails', async function () {
      // Arrange
      authClientUsersMock.create.rejects();
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym: 'qtest-0001' }));

      // Assert
      expect(result).to.have.status(StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('should fail if the pseudonym contains uppercase letters', async function () {
      // Arrange
      const pseudonym = 'QTest-0001';
      const studyName = 'QTestStudy1';

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym }));

      expect(result).to.have.status(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(result.body).to.deep.equal({
        statusCode: 422,
        error: 'Unprocessable Entity',
        message:
          "Payload is invalid:\nparticipant.pseudonym: QTest-0001 --> Not match in '^[a-z0-9]+-[0-9]+$'",
      });
    });

    it('should return 201 if creating a new proband', async function () {
      // Arrange
      const pseudonym = 'qtest-0001';
      const studyName = 'QTestStudy1';
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          MessageQueueTopic.PROBAND_CREATED,
          testSandbox
        );

      // Act
      const result = await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(createParticipantRequest({ pseudonym }));

      // Assert
      expect(result).to.have.status(StatusCodes.CREATED);
      expect(result.body).to.have.property('pseudonym').that.equals(pseudonym);
      expect(result.body).to.have.property('password').that.is.a('string');

      await probandCreated;

      const participant = await getRepository(Proband).findOneOrFail({
        where: { pseudonym },
        loadRelationIds: { relations: ['study'], disableMixedMap: true },
      });

      expect(participant).to.deep.include({
        pseudonym,
        ids: null,
        study: { name: studyName },
        status: 'active',
        studyCenter: 'test_sz',
        examinationWave: 1,
        complianceContact: true,
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        isTestProband: false,
        origin: 'public_api',
      });
    });

    it('should return 201 and generate a pseudonym if none was given', async () => {
      // Arrange
      const studyName = 'QTestStudy1';
      const probandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          MessageQueueTopic.PROBAND_CREATED,
          testSandbox
        );

      // Act
      const result = (await chai
        .request(apiAddress)
        .post(`/public/studies/${studyName}/participants`)
        .set(apiClientHeader)
        .send(
          createParticipantRequest()
        )) as Response<CreateParticipantResponseDto>;

      // Assert
      expect(result).to.have.status(StatusCodes.CREATED);
      expect(result.body).to.have.property('pseudonym').that.is.a('string');
      expect(result.body).to.have.property('password').that.is.a('string');

      await probandCreated;

      const participant = await getRepository(Proband).findOneOrFail({
        where: { pseudonym: result.body.pseudonym },
        loadRelationIds: { relations: ['study'], disableMixedMap: true },
      });

      expect(participant).to.deep.include({
        pseudonym: result.body.pseudonym,
        ids: null,
        study: { name: studyName },
        status: 'active',
        studyCenter: 'test_sz',
        examinationWave: 1,
        complianceContact: true,
        complianceLabresults: false,
        complianceSamples: false,
        complianceBloodsamples: false,
        isTestProband: false,
        origin: 'public_api',
      });
    });
  });

  describe('PATCH /public/studies/{studyName}/participants/{pseudonym}', () => {
    beforeEach(() =>
      mockGetProbandAccount(testSandbox, 'test01-1111', 'QTestStudy1')
    );

    it('should return 401 if no auth token is appended', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/test01-1111`)
        .send({ studyCenter: 'new_sz' });

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/test01-1111`)
        .send({ studyCenter: 'new_sz' })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if API client does not have study access', async () => {
      // Arrange
      const studyName = 'QTestStudy2';

      // Act
      const response = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/test01-1111`)
        .send({ studyCenter: 'new_sz' })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 404 if participant was not found', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/qtest-9999`)
        .send({ studyCenter: 'new_sz' })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return 404 if participant is in another study', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/qtest-5555`)
        .send({ studyCenter: 'new_sz' })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should update the study center and return the participant', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/test01-1111`)
        .send({ studyCenter: 'new_sz' })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal({
        pseudonym: 'test01-1111',
        ids: null,
        study: 'QTestStudy1',
        status: 'active',
        accountStatus: 'account',
        studyCenter: 'new_sz',
        examinationWave: 1,
        firstLoggedInAt: null,
        deactivatedAt: null,
        deletedAt: null,
        isTestParticipant: false,
      });
    });

    it('should turn the participant into a test participant and return it', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .patch(`/public/studies/${studyName}/participants/test01-1111`)
        .send({ isTestParticipant: true })
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal({
        pseudonym: 'test01-1111',
        ids: null,
        study: 'QTestStudy1',
        status: 'active',
        accountStatus: 'account',
        studyCenter: null,
        examinationWave: 1,
        firstLoggedInAt: null,
        deactivatedAt: null,
        deletedAt: null,
        isTestParticipant: true,
      });
    });
  });

  describe('DELETE /public/studies/{studyName}/participants/{pseudonym}', () => {
    beforeEach(() =>
      mockGetProbandAccount(testSandbox, 'test01-1111', 'QTestStudy1')
    );

    it('should return 401 if no auth token is appended', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/public/studies/${studyName}/participants/test01-1111`);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 401 if auth token is invalid', async () => {
      // Arrange
      AuthServerMock.cleanAll();
      AuthServerMock.adminRealm().returnInvalid();
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return 403 if API client does not have study access', async () => {
      // Arrange
      const studyName = 'QTestStudy2';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return 404 if participant was not found', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response = await chai
        .request(apiAddress)
        .delete(`/public/studies/${studyName}/participants/qtest-9999`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NOT_FOUND);
    });

    it("should only delete the participant's data", async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .delete(`/public/studies/${studyName}/participants/test01-1111`)
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NO_CONTENT);

      const participant = await getRepository(Proband).findOne({
        where: { pseudonym: 'test01-1111' },
      });
      expect(participant).to.contain({
        pseudonym: 'test01-1111',
        status: 'deleted',
      });
    });

    it('should fully delete the participant', async () => {
      // Arrange
      const studyName = 'QTestStudy1';

      // Act
      const response: { body: ParticipantDto[] } = await chai
        .request(apiAddress)
        .delete(
          `/public/studies/${studyName}/participants/test01-1111?deletionType=full`
        )
        .set(apiClientHeader);

      // Assert
      expect(response).to.have.status(StatusCodes.NO_CONTENT);

      const participant = await getRepository(Proband).findOne({
        where: { pseudonym: 'test01-1111' },
      });
      expect(participant).to.be.undefined;
    });
  });
});

function createParticipantRequest(
  overwrite?: Partial<CreateParticipantRequestDto>
): CreateParticipantRequestDto {
  return {
    studyCenter: 'test_sz',
    examinationWave: 1,
    ...overwrite,
  };
}

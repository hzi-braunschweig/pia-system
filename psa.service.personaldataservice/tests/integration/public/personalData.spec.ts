/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { createSandbox } from 'sinon';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import { config } from '../../../src/config';
import { Server } from '../../../src/server';
import { userserviceClient } from '../../../src/clients/userserviceClient';
import { sprintPath } from './utilities';
import { publicApiMatchers } from './matchers';
import { PersonalDataPatchRequestDto } from '../../../src/controllers/dtos/personalDataRequestDto';
import fetchMocker from 'fetch-mock';
import {
  StudyInternalDto,
  HttpClient,
} from '@pia-system/lib-http-clients-internal';
import { mockUpdateAccountMailAddress } from '../mockUpdateAccountMailAddress.helper.spec';

chai.use(chaiHttp);
chai.use(publicApiMatchers);

const apiClientHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: [],
  username: '',
  studies: ['Study A', 'Study B', 'DoesNotExist', 'Dev'], // has no access to Study X
});

const apiAddress = `http://localhost:${config.public.port}`;

const pathPersonalData =
  '/public/studies/{studyName}/participants/{pseudonym}/personal-data';

describe(pathPersonalData, () => {
  const http = chai.request(apiAddress);
  const testSandbox = createSandbox();
  const fetchMock = fetchMocker.sandbox();

  let userserviceClientStub: sinon.SinonStub;

  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(() => {
    userserviceClientStub = sinon
      .stub(userserviceClient, 'getStudy')
      .callsFake(async (name) =>
        Promise.resolve({
          name,
          status: 'active',
        } as unknown as StudyInternalDto)
      );

    AuthServerMock.adminRealm().returnValid();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    testSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    userserviceClientStub.restore();
    AuthServerMock.cleanAll();
    testSandbox.restore();
    fetchMock.restore();
  });

  context('PATCH /', () => {
    it('should update the personal data of a participant', async () => {
      // Arrange
      mockUpdateAccountMailAddress('studya-001', testSandbox);
      fetchMock.get('express:/user/users/:pseudonym', {
        body: { study: 'Study A', complianceContact: true },
      });

      const segments = { studyName: 'Study A', pseudonym: 'studya-001' };
      const payload: PersonalDataPatchRequestDto = {
        salutation: 'Ms.',
        title: 'Dr.',
        firstname: 'Jane',
        lastname: 'Doe',
        address: {
          street: 'Street',
          houseNumber: '1',
          postalCode: '12345',
          city: 'City',
          state: 'State',
        },
        phone: {
          private: '123456789',
          work: '987654321',
          mobile: '123123123',
        },
        email: 'some-email@local.host',
        comment: 'Some comment',
      };

      // Act
      const response = await http
        .patch(sprintPath(pathPersonalData, segments))
        .set(apiClientHeader)
        .send(payload);

      // Assert
      expect(response).to.have.status(StatusCodes.OK);
      expect(response.body).to.deep.equal(payload);
    });

    context('partial updates', () => {
      const testCases: [string, PersonalDataPatchRequestDto][] = [
        ['email', { email: 'some-email@local.host' }],
        ['house number', { address: { houseNumber: '2b' } }],
        [
          'email, lastname and phone',
          {
            lastname: 'Doe',
            phone: { private: '123456789' },
            email: 'some-email@local.host',
          },
        ],
      ];

      for (const [testName, payload] of testCases) {
        it(`should return partial data on partial update for ${testName}`, async () => {
          // Arrange
          mockUpdateAccountMailAddress('studya-001', testSandbox);
          fetchMock.get('express:/user/users/:pseudonym', {
            body: { study: 'Study A', complianceContact: true },
          });

          const segments = { studyName: 'Study A', pseudonym: 'studya-001' };

          // Act
          const response = await http
            .patch(sprintPath(pathPersonalData, segments))
            .set(apiClientHeader)
            .send(payload);

          // Assert
          expect(response).to.have.status(StatusCodes.OK);
          expect(response.body).to.deep.equal(payload);
        });
      }
    });

    context('errors', () => {
      it('should return 401 if no auth token is appended', async () => {
        // Act
        const response = await http
          .patch(
            sprintPath(pathPersonalData, {
              studyName: 'Study A',
              pseudonym: 'studya-001',
            })
          )
          .send();

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 401 if auth token is invalid', async () => {
        // Arrange
        AuthServerMock.cleanAll();
        AuthServerMock.adminRealm().returnInvalid();

        // Act
        const response = await http
          .patch(
            sprintPath(pathPersonalData, {
              studyName: 'Study A',
              pseudonym: 'studya-001',
            })
          )
          .set(apiClientHeader)
          .send();

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 403 if API client does not have study access', async () => {
        const response = await http
          .patch(
            sprintPath(pathPersonalData, {
              studyName: 'Study X',
              pseudonym: 'studya-001',
            })
          )
          .set(apiClientHeader)
          .send();

        expect(response).to.have.failWithNoStudyAccessFor('Study X');
      });

      it('should return 404 if the study does not exist', async function () {
        // Arrange
        const segments = {
          studyName: 'DoesNotExist',
          pseudonym: 'studya-001',
        };
        const payload: PersonalDataPatchRequestDto = {
          email: 'some-email@localhost.local',
        };

        userserviceClientStub.resolves(null);

        // Act
        const response = await http
          .patch(sprintPath(pathPersonalData, segments))
          .set(apiClientHeader)
          .send(payload);

        // Assert
        expect(response).to.failWithStudyNotFound(segments.studyName);
      });

      it('should return 404 if the pseudonym does not exist', async function () {
        fetchMock.get('express:/user/users/:pseudonym', {
          status: StatusCodes.NOT_FOUND,
        });
        const segments = { studyName: 'Study A', pseudonym: 'nostudy-001' };
        const payload: PersonalDataPatchRequestDto = {
          email: 'some-email@localhost.local',
        };

        const response = await http
          .patch(sprintPath(pathPersonalData, segments))
          .set(apiClientHeader)
          .send(payload);

        expect(response).to.failWithError({
          statusCode: StatusCodes.NOT_FOUND,
          message: `Participant with pseudonym "${segments.pseudonym}" does not exist`,
        });
      });

      it('should return 404 if the pseudonym does exist but not in the selected study', async function () {
        // Arrange
        fetchMock.get('express:/user/users/:pseudonym', {
          body: { study: 'Study X', complianceContact: true },
        });
        const segments = { studyName: 'Study A', pseudonym: 'studyx-001' };
        const payload: PersonalDataPatchRequestDto = {
          email: 'some-email@localhost.local',
        };

        // Act
        const response = await http
          .patch(sprintPath(pathPersonalData, segments))
          .set(apiClientHeader)
          .send(payload);

        // Assert
        expect(response).to.failWithError({
          statusCode: StatusCodes.NOT_FOUND,
          message: `Participant with pseudonym "${segments.pseudonym}" does not exist`,
        });
      });

      it('should return 422 when trying to set an invalid email address', async () => {
        // Arrange
        const segments = { studyName: 'Study A', pseudonym: 'studya-001' };
        const payload: PersonalDataPatchRequestDto = { email: 'invalid-email' };

        // Act
        const response = await http
          .patch(sprintPath(pathPersonalData, segments))
          .set(apiClientHeader)
          .send(payload);

        // Assert
        expect(response).to.failWithInvalidPayload(
          "personalData.email: invalid-email --> Not match in '^.+\\@.+\\..+$'"
        );
      });

      it('should return 403 when contact compliance is false', async () => {
        // Arrange
        fetchMock.get('express:/user/users/:pseudonym', {
          body: { study: 'Study A', complianceContact: false },
        });
        const segments = { studyName: 'Study A', pseudonym: 'studya-001' };
        const payload: PersonalDataPatchRequestDto = {
          email: 'some-email@localhost.local',
        };

        // Act
        const response = await http
          .patch(sprintPath(pathPersonalData, segments))
          .set(apiClientHeader)
          .send(payload);

        // Assert
        expect(response).to.failWithError({
          statusCode: StatusCodes.FORBIDDEN,
          message: 'Participant has refused to be contacted',
        });
      });
    });
  });
});

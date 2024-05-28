/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import {
  LabResultInternalDto,
  QuestionnaireInstanceStatus,
  QuestionnaireType,
} from '@pia-system/lib-http-clients-internal';
import { PatchSampleInternalDto } from '@pia-system/lib-http-clients-internal/src/dtos/sample';
import {
  MessageQueueClient,
  MessageQueueTopic,
  QuestionnaireInstanceReleasedMessage,
} from '@pia/lib-messagequeue';
import { AuthServerMock, AuthTokenMockBuilder } from '@pia/lib-service-core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { addDays, formatISO, subDays } from 'date-fns';
import { StatusCodes } from 'http-status-codes';
import * as sinon from 'sinon';
import { createSandbox } from 'sinon';
import { getConnection } from 'typeorm';
import { sampletrackingserviceClient } from '../../../src/clients/sampletrackingserviceClient';
import { userserviceClient } from '../../../src/clients/userserviceClient';
import { config } from '../../../src/config';
import { PatchQuestionnaireInstanceResponseDto } from '../../../src/controllers/public/dtos/patchQuestionnaireInstanceDtos';
import {
  PostAnswerRequestDto,
  PostAnswerResponseDto,
} from '../../../src/controllers/public/dtos/postAnswerDto';
import { Answer } from '../../../src/entities/answer';
import { QuestionnaireInstance } from '../../../src/entities/questionnaireInstance';
import { Server } from '../../../src/server';
import { publicApiMatchers } from './matchers';
import {
  answerQ1A1,
  answerQ1A2,
  answerQ1A3,
  answerQ1A4,
  answerQ1A5,
  answerQ2A10,
  answerQ2A11,
  answerQ2A6,
  answerQ2A7,
  answerQ2A8,
  answerQ2A9,
  getCompletePostAnswersRequest,
  JPEG_BASE64,
} from './questionnaireInstances.spec.data/postAnswerRequests';
import {
  PlainGetQuestionnaireInstanceResponseDto,
  questionnaireInstance_100100,
  questionnaireInstance_100101,
  questionnaireInstance_110100,
  questionnaireInstance_110101,
} from './questionnaireInstances.spec.data/questionnaireInstanceResponses';
import {
  cleanup,
  setup,
} from './questionnaireInstances.spec.data/setup.helper';
import {
  setQuestionnaireCycleUnit,
  setQuestionnaireInstanceStatus,
  setQuestionnaireType,
  sprintPath,
  waitForConditionToBeTrue,
} from './utilities';

chai.use(chaiHttp);
chai.use(publicApiMatchers);

const apiClientHeader = AuthTokenMockBuilder.createAuthHeader({
  roles: [],
  username: '',
  studies: ['Study A', 'Study B', 'DoesNotExist', 'Dev'], // has no access to Study X
});

const apiAddress = `http://localhost:${config.public.port}`;

const questionnaires = {
  StudyA: {
    stya0000000001: {
      questionnaire_a: {
        studyName: 'Study A',
        pseudonym: 'stya-0000000001',
        questionnaireCustomName: 'questionnaire_a',
        instanceId: 100100,
        id: 100,
      },
      // has predefined answers up to release version 3
      questionnaire_b: {
        studyName: 'Study A',
        pseudonym: 'stya-0000000001',
        questionnaireCustomName: 'questionnaire_b',
        instanceId: 110101,
        id: 110,
      },
      does_not_exist: {
        studyName: 'Study A',
        pseudonym: 'stya-0000000001',
        questionnaireCustomName: 'does_not_exist',
        instanceId: 123,
      },
    },
  },
  StudyB: {
    styb0000000001: {
      questionnaire_a: {
        studyName: 'Study B',
        pseudonym: 'styb-0000000001',
        questionnaireCustomName: 'questionnaire_a',
        instanceId: 200100,
        id: 200,
      },
      questionnaire_a_released_once: {
        studyName: 'Study B',
        pseudonym: 'styb-0000000001',
        questionnaireCustomName: 'questionnaire_a',
        instanceId: 200101,
        id: 200,
      },
    },
  },
  StudyX: {
    styx0000000001: {
      questionnaire_a: {
        studyName: 'Study X',
        pseudonym: 'styx-0000000001',
        questionnaireCustomName: 'questionnaire_a',
        instanceId: 123,
      },
    },
  },
  DoesNotExist: {
    DoesNotExist0000000001: {
      questionnaire_a: {
        studyName: 'DoesNotExist',
        pseudonym: 'doesnotexist-0000000001',
        questionnaireCustomName: 'questionnaire_a',
        instanceId: 123,
      },
    },
  },
};

const pathQuestionnaireInstances =
  '/public/studies/{studyName}/participants/{pseudonym}/questionnaire-instances';
const pathIdentifier = '/{instanceId}';
const pathQuestionnaireInstance = pathQuestionnaireInstances + pathIdentifier;
const pathQuestionnaireInstanceAnswers =
  pathQuestionnaireInstances + pathIdentifier + '/answers';

describe(pathQuestionnaireInstances, () => {
  const http = chai.request(apiAddress);
  const testSandbox = createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);
  let messageQueueHistory: QuestionnaireInstanceReleasedMessage[] = [];
  let sampletrackingserviceClientStub: sinon.SinonStub;
  let userserviceClientStub: sinon.SinonStub;

  before(async function () {
    await Server.init();
    await mqc.connect(true);
    await mqc.createConsumer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
      async (message: QuestionnaireInstanceReleasedMessage) => {
        messageQueueHistory.push(message);
        return Promise.resolve();
      }
    );
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
  });

  beforeEach(async function () {
    sampletrackingserviceClientStub = sinon
      .stub(sampletrackingserviceClient, 'patchSample')
      .callsFake(
        async (
          _: string,
          pseudonym: string,
          sampleId: string,
          sample: PatchSampleInternalDto
        ) => {
          return Promise.resolve({
            ...sample,
            id: sampleId,
            dateOfSampling: new Date(),
            pseudonym,
            status: null,
            remark: null,
            performingDoctor: null,
            newSamplesSent: null,
            studyStatus: null,
          } as LabResultInternalDto);
        }
      );

    userserviceClientStub = sinon
      .stub(userserviceClient, 'getStudy')
      .callsFake(async (name) =>
        Promise.resolve({
          proband_realm_group_id: 'abc-def',
          description: '',
          has_open_self_registration: false,
          max_allowed_accounts_count: null,
          accounts_count: 0,
          has_rna_samples: true,
          address: '',
          sample_suffix_length: 10,
          sample_prefix: 'SAMPLE',
          has_answers_notify_feature: false,
          has_answers_notify_feature_by_mail: false,
          has_compliance_opposition: false,
          has_four_eyes_opposition: false,
          has_partial_opposition: false,
          has_total_opposition: false,
          has_logging_opt_in: false,
          has_required_totp: false,
          pseudonym_prefix: 'DEV',
          pseudonym_suffix_length: 8,
          hub_email: '',
          name,
          pendingStudyChange: null,
          pm_email: '',
          status: 'active',
        })
      );

    AuthServerMock.adminRealm().returnValid();
    messageQueueHistory = [];
    await setup();
  });

  afterEach(async function () {
    userserviceClientStub.restore();
    sampletrackingserviceClientStub.restore();
    AuthServerMock.cleanAll();
    await cleanup();
    testSandbox.restore();
  });

  describe(`GET /`, () => {
    it('should return 200 and all questionnaire instances', async function () {
      const expectedResponse: PlainGetQuestionnaireInstanceResponseDto[] = [
        questionnaireInstance_100100,
        questionnaireInstance_110101,
      ];

      const response = await http
        .get(
          sprintPath(pathQuestionnaireInstances, {
            studyName: questionnaireInstance_100100.studyName,
            pseudonym: questionnaireInstance_100100.pseudonym,
          })
        )
        .set(apiClientHeader)
        .send();

      expect(response.body).to.deep.equal(expectedResponse);
      expect(response).to.have.status(StatusCodes.OK);
    });

    context('query parameters', () => {
      const testCases = [
        // status query
        {
          pseudonym: 'stya-0000000001',
          query: `?status=active`,
          expectedResponse: [questionnaireInstance_100100],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?status=active`,
          expectedResponse: [],
        },
        {
          pseudonym: 'stya-0000000001',
          query: `?status=released_once`,
          expectedResponse: [],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?status=released_once`,
          expectedResponse: [questionnaireInstance_110100],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?status=in_progress`,
          expectedResponse: [questionnaireInstance_100101],
        },
        // questionnaireCustomName query
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_a`,
          expectedResponse: [questionnaireInstance_100100],
        },
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_b`,
          expectedResponse: [questionnaireInstance_110101],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?questionnaireCustomName=questionnaire_a`,
          expectedResponse: [questionnaireInstance_100101],
        },
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_c`,
          expectedResponse: [],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?questionnaireCustomName=questionnaire_b`,
          expectedResponse: [questionnaireInstance_110100],
        },
        // combined query parameters
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_a&status=active`,
          expectedResponse: [questionnaireInstance_100100],
        },
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_a&status=in_progress`,
          expectedResponse: [],
        },
        {
          pseudonym: 'stya-0000000001',
          query: `?questionnaireCustomName=questionnaire_b&status=in_progress`,
          expectedResponse: [questionnaireInstance_110101],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?questionnaireCustomName=questionnaire_a&status=in_progress`,
          expectedResponse: [questionnaireInstance_100101],
        },
        {
          pseudonym: 'styb-0000000001',
          query: `?questionnaireCustomName=questionnaire_b&status=in_progress`,
          expectedResponse: [],
        },
      ];

      for (const testCase of testCases) {
        const url = `../${testCase.pseudonym}/../${testCase.query}`;
        it(`should return 200 and questionnaire instances for "${url}"`, async function () {
          const response = await http
            .get(
              sprintPath(pathQuestionnaireInstances, {
                studyName: questionnaireInstance_100100.studyName,
                pseudonym: testCase.pseudonym,
              }) + testCase.query
            )
            .set(apiClientHeader)
            .send();

          expect(response.body).to.deep.equal(testCase.expectedResponse);
          expect(response).to.have.status(StatusCodes.OK);
        });
      }
    });

    describe('errors', () => {
      it('should return 401 if no auth token is appended', async () => {
        // Act
        const response = await http
          .get(
            sprintPath(
              pathQuestionnaireInstances,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
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
          .get(
            sprintPath(
              pathQuestionnaireInstances,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send();

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 403 if API client does not have study access', async () => {
        const response = await http
          .get(
            sprintPath(
              pathQuestionnaireInstances,
              questionnaires.StudyX.styx0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send();

        expect(response).to.have.failWithNoStudyAccessFor('Study X');
      });

      it('should return 404 if the study does not exist', async function () {
        const segments =
          questionnaires.DoesNotExist.DoesNotExist0000000001.questionnaire_a;

        userserviceClientStub.resolves(null);

        const response = await http
          .get(sprintPath(pathQuestionnaireInstances, segments))
          .set(apiClientHeader)
          .send();

        expect(response).to.failWithStudyNotFound(segments.studyName);
      });
    });
  });

  describe(`PATCH ${pathIdentifier}`, () => {
    describe('should return 200 when', () => {
      it('questionnaire instance for proband was released and increase release version', async function () {
        // Arrange
        const segments = questionnaires.StudyA.stya0000000001.questionnaire_b;

        await setQuestionnaireType(segments.id, 'for_probands');

        const expectedMessages: QuestionnaireInstanceReleasedMessage[] = [
          {
            id: segments.instanceId,
            releaseVersion: 1,
            studyName: segments.studyName,
          },
          {
            id: segments.instanceId,
            releaseVersion: 2,
            studyName: segments.studyName,
          },
        ];

        // Act
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        for (let releaseVersion = 1; releaseVersion <= 2; releaseVersion++) {
          const status: QuestionnaireInstanceStatus =
            releaseVersion === 1 ? 'released_once' : 'released_twice';

          const expectedResponse: PatchQuestionnaireInstanceResponseDto = {
            status,
            releaseVersion,
            progress: 100,
          };

          AuthServerMock.adminRealm().returnValid();
          const response = await http
            .patch(sprintPath(pathQuestionnaireInstance, segments))
            .set(apiClientHeader)
            .send({ status });

          // Assert
          expect(response.body).to.deep.equal(
            {
              ...expectedResponse,
              releaseVersion,
            },
            `Release version ${releaseVersion}`
          );
          expect(response).to.have.status(StatusCodes.OK);
        }

        const messagesHaveBeenReceived = (): boolean =>
          messageQueueHistory.length >= expectedMessages.length;

        await waitForConditionToBeTrue(messagesHaveBeenReceived, 3);

        expect(messageQueueHistory).to.deep.equal(expectedMessages);
      });

      it('questionnaire instance for research team was released and increase release version', async function () {
        // Arrange
        const segments = questionnaires.StudyA.stya0000000001.questionnaire_b;
        const status: QuestionnaireInstanceStatus = 'released';
        const expectedMessages: QuestionnaireInstanceReleasedMessage[] = [
          {
            id: segments.instanceId,
            releaseVersion: 1,
            studyName: segments.studyName,
          },
          {
            id: segments.instanceId,
            releaseVersion: 2,
            studyName: segments.studyName,
          },
          {
            id: segments.instanceId,
            releaseVersion: 3,
            studyName: segments.studyName,
          },
        ];

        // Act
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        for (let releaseVersion = 1; releaseVersion <= 3; releaseVersion++) {
          const expectedResponse: PatchQuestionnaireInstanceResponseDto = {
            status,
            releaseVersion,
            progress: 100,
          };

          AuthServerMock.adminRealm().returnValid();
          const response = await http
            .patch(sprintPath(pathQuestionnaireInstance, segments))
            .set(apiClientHeader)
            .send({ status });

          // Assert
          expect(response.body).to.deep.equal(
            {
              ...expectedResponse,
              releaseVersion,
            },
            `Release version ${releaseVersion}`
          );
          expect(response).to.have.status(StatusCodes.OK);
        }

        const messagesHaveBeenReceived = (): boolean =>
          messageQueueHistory.length >= expectedMessages.length;

        await waitForConditionToBeTrue(messagesHaveBeenReceived, 3);

        expect(messageQueueHistory).to.deep.equal(expectedMessages);
      });

      it('questionnaire instance for proband was released twice and copy answers to next version', async () => {
        // Arrange
        const segments = questionnaires.StudyB.styb0000000001.questionnaire_a;

        await setQuestionnaireType(segments.id, 'for_probands');
        await setQuestionnaireInstanceStatus(
          segments.instanceId,
          'released_once',
          1
        );

        const status: QuestionnaireInstanceStatus = 'released_twice';
        const expectedResponse: PatchQuestionnaireInstanceResponseDto = {
          status,
          progress: 80,
          releaseVersion: 2,
        };

        // Act
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        AuthServerMock.adminRealm().returnValid();
        const response = await http
          .patch(sprintPath(pathQuestionnaireInstance, segments))
          .set(apiClientHeader)
          .send({ status });

        // Assert
        expect(response.body).to.deep.equal(expectedResponse);
        expect(response).to.have.status(StatusCodes.OK);

        const countAnswersV1 = await getConnection()
          .getRepository(Answer)
          .count({
            where: {
              questionnaireInstance: segments.instanceId,
              versioning: 1,
            },
          });

        const countAnswersV2 = await getConnection()
          .getRepository(Answer)
          .count({
            where: {
              questionnaireInstance: segments.instanceId,
              versioning: 2,
            },
          });

        expect(countAnswersV2).to.equal(
          countAnswersV1,
          'Count of copyied answers is incorrect'
        );
      });

      context('when selected by custom name and', () => {
        it('questionnaire instance for proband was released and increase release version', async function () {
          // Arrange
          const segments = questionnaires.StudyA.stya0000000001.questionnaire_b;

          await setQuestionnaireType(segments.id, 'for_probands');

          const expectedMessages: QuestionnaireInstanceReleasedMessage[] = [
            {
              id: segments.instanceId,
              releaseVersion: 1,
              studyName: segments.studyName,
            },
            {
              id: segments.instanceId,
              releaseVersion: 2,
              studyName: segments.studyName,
            },
          ];

          // Act
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          for (let releaseVersion = 1; releaseVersion <= 2; releaseVersion++) {
            const status: QuestionnaireInstanceStatus =
              releaseVersion === 1 ? 'released_once' : 'released_twice';

            const expectedResponse: PatchQuestionnaireInstanceResponseDto = {
              status,
              releaseVersion,
              progress: 100,
            };

            AuthServerMock.adminRealm().returnValid();
            const response = await http
              .patch(
                sprintPath(pathQuestionnaireInstance, {
                  ...segments,
                  instanceId: segments.questionnaireCustomName,
                })
              )
              .set(apiClientHeader)
              .send({ status });

            // Assert
            expect(response.body).to.deep.equal(
              {
                ...expectedResponse,
                releaseVersion,
              },
              `Release version ${releaseVersion}`
            );
            expect(response).to.have.status(StatusCodes.OK);
          }

          const messagesHaveBeenReceived = (): boolean =>
            messageQueueHistory.length >= expectedMessages.length;

          await waitForConditionToBeTrue(messagesHaveBeenReceived, 3);

          expect(messageQueueHistory).to.deep.equal(expectedMessages);
        });
      });
    });

    describe('errors', () => {
      it('should return 401 if no auth token is appended', async () => {
        // Act
        const response = await http
          .patch(
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
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
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send();

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 403 if API client does not have study access', async () => {
        const response = await http
          .patch(
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyX.styx0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send();

        expect(response).to.have.failWithNoStudyAccessFor('Study X');
      });

      it('should return 404 if the study does not exist', async function () {
        const status: QuestionnaireInstanceStatus = 'released';
        const segments =
          questionnaires.DoesNotExist.DoesNotExist0000000001.questionnaire_a;

        userserviceClientStub.resolves(null);

        const response = await http
          .patch(sprintPath(pathQuestionnaireInstance, segments))
          .set(apiClientHeader)
          .send({ status });

        expect(response).to.failWithStudyNotFound(segments.studyName);
      });

      it('should return 404 if the questionnaire does not exist', async function () {
        const segments = questionnaires.StudyA.stya0000000001.does_not_exist;
        const status: QuestionnaireInstanceStatus = 'released';

        const response = await http
          .patch(sprintPath(pathQuestionnaireInstance, segments))
          .set(apiClientHeader)
          .send({ status });

        expect(response).to.failWithError({
          statusCode: StatusCodes.NOT_FOUND,
          message: `A questionnaire instance for a questionnaire with id "${segments.instanceId}" does not exist`,
        });
      });

      it('should return 422 when trying to set a non existing status value', async () => {
        // Arrange
        const status: QuestionnaireInstanceStatus =
          'not_a_valid_status' as QuestionnaireInstanceStatus;

        // Act
        const response = await http
          .patch(
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send({ status });

        // Assert
        expect(response).to.failWithInvalidPayload(
          'questionnaire.status: not_a_valid_status'
        );
      });

      it('should return 412 when trying to release without answers for the next release version', async () => {
        // Arrange
        const segments = questionnaires.StudyA.stya0000000001.questionnaire_a;
        const status: QuestionnaireInstanceStatus = 'released';

        // Act
        const response = await http
          .patch(sprintPath(pathQuestionnaireInstance, segments))
          .set(apiClientHeader)
          .send({ status });

        // Assert
        expect(response).to.failWithError({
          statusCode: StatusCodes.PRECONDITION_FAILED,
          message: `Questionnaire instance ${segments.instanceId} has no answers for release version 1`,
        });
      });

      context('custom name', () => {
        it('should return 403 when questionnaire instance is recurring', async () => {
          // Arrange
          const segments = questionnaires.StudyA.stya0000000001.questionnaire_a;
          const status: QuestionnaireInstanceStatus = 'released';

          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          await setQuestionnaireCycleUnit(segments.id, 'day');

          // Act
          const response = await http
            .patch(
              sprintPath(pathQuestionnaireInstance, {
                ...segments,
                instanceId: segments.questionnaireCustomName,
              })
            )
            .set(apiClientHeader)
            .send({ status });

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.FORBIDDEN,
            message:
              'The questionnaire for the selected instance is recurring and does not create a single, unique questionnaire instance.',
          });
        });

        it('should return 404 if the questionnaire does not exist', async function () {
          const segments = questionnaires.StudyA.stya0000000001.does_not_exist;
          const status: QuestionnaireInstanceStatus = 'released';

          const response = await http
            .patch(
              sprintPath(pathQuestionnaireInstance, {
                ...segments,
                instanceId: segments.questionnaireCustomName,
              })
            )
            .set(apiClientHeader)
            .send({ status });

          expect(response).to.failWithError({
            statusCode: StatusCodes.NOT_FOUND,
            message: `A questionnaire instance for a questionnaire with the custom name "${segments.questionnaireCustomName}" does not exist`,
          });
        });
      });
    });

    describe('status transitions', () => {
      const testTypes: QuestionnaireType[] = [
        'for_probands',
        'for_research_team',
      ];

      describe('never allow', () => {
        const testCases: {
          from: QuestionnaireInstanceStatus;
          to: QuestionnaireInstanceStatus;
        }[] = [
          { from: 'inactive', to: 'in_progress' },
          { from: 'inactive', to: 'released' },
          { from: 'inactive', to: 'released_once' },
          { from: 'inactive', to: 'released_twice' },
          { from: 'inactive', to: 'expired' },
          { from: 'inactive', to: 'deleted' },
          { from: 'inactive', to: 'inactive' },
          { from: 'inactive', to: 'active' },
          { from: 'active', to: 'inactive' },
          { from: 'active', to: 'released_twice' },
          { from: 'active', to: 'expired' },
          { from: 'active', to: 'deleted' },
          { from: 'active', to: 'active' },
          { from: 'in_progress', to: 'inactive' },
          { from: 'in_progress', to: 'active' },
          { from: 'in_progress', to: 'released_twice' },
          { from: 'in_progress', to: 'deleted' },
          { from: 'released', to: 'active' },
          { from: 'released', to: 'in_progress' },
          { from: 'released', to: 'released_once' },
          { from: 'released', to: 'released_twice' },
          { from: 'released', to: 'deleted' },
          { from: 'released_once', to: 'in_progress' },
          { from: 'released_once', to: 'released' },
          { from: 'released_once', to: 'expired' },
          { from: 'released_once', to: 'deleted' },
          { from: 'released_once', to: 'active' },
          { from: 'released_once', to: 'released_once' },
          { from: 'released_twice', to: 'in_progress' },
          { from: 'released_twice', to: 'released' },
          { from: 'released_twice', to: 'released_once' },
          { from: 'released_twice', to: 'released_twice' },
          { from: 'released_twice', to: 'expired' },
          { from: 'released_twice', to: 'deleted' },
          { from: 'released_twice', to: 'active' },
          { from: 'deleted', to: 'in_progress' },
          { from: 'deleted', to: 'released' },
          { from: 'deleted', to: 'released_once' },
          { from: 'deleted', to: 'released_twice' },
          { from: 'deleted', to: 'expired' },
          { from: 'deleted', to: 'inactive' },
          { from: 'deleted', to: 'active' },
          { from: 'deleted', to: 'deleted' },
          { from: 'expired', to: 'in_progress' },
          { from: 'expired', to: 'released' },
          { from: 'expired', to: 'released_once' },
          { from: 'expired', to: 'released_twice' },
          { from: 'expired', to: 'deleted' },
          { from: 'expired', to: 'inactive' },
          { from: 'expired', to: 'active' },
          { from: 'expired', to: 'expired' },
        ];
        for (const testType of testTypes) {
          for (const testCase of testCases) {
            it(`transitioning questionnaire instance of type ${testType} from ${testCase.from} to ${testCase.to}`, async () => {
              // Arrange
              // eslint-disable-next-line @typescript-eslint/no-magic-numbers
              await setQuestionnaireInstanceStatus(
                questionnaires.StudyA.stya0000000001.questionnaire_a.instanceId,
                testCase.from
              );
              await setQuestionnaireType(
                questionnaires.StudyA.stya0000000001.questionnaire_a.id,
                testType
              );

              // Act
              const response = await http
                .patch(
                  sprintPath(
                    pathQuestionnaireInstance,
                    questionnaires.StudyA.stya0000000001.questionnaire_a
                  )
                )
                .set(apiClientHeader)
                .send({ status: testCase.to });

              // Assert
              expect(response).to.failWithError({
                statusCode: StatusCodes.BAD_REQUEST,
                message: `A transition from '${testCase.from}' to '${testCase.to}' is not allowed`,
              });
            });
          }
        }
      });

      describe('questionnaire type specific', () => {
        const testCases: {
          from: QuestionnaireInstanceStatus;
          to: QuestionnaireInstanceStatus;
          type: QuestionnaireType;
          expect: { status: StatusCodes; releaseVersion: number };
        }[] = [
          {
            from: 'active',
            to: 'in_progress',
            type: 'for_research_team',
            expect: { status: StatusCodes.OK, releaseVersion: 0 },
          },
          {
            from: 'in_progress',
            to: 'in_progress',
            type: 'for_research_team',
            expect: { status: StatusCodes.OK, releaseVersion: 0 },
          },
          {
            from: 'in_progress',
            to: 'released',
            type: 'for_research_team',
            expect: { status: StatusCodes.OK, releaseVersion: 1 },
          },
          {
            from: 'active',
            to: 'released',
            type: 'for_research_team',
            expect: { status: StatusCodes.OK, releaseVersion: 1 },
          },
          {
            from: 'active',
            to: 'in_progress',
            type: 'for_probands',
            expect: { status: StatusCodes.OK, releaseVersion: 0 },
          },
          {
            from: 'in_progress',
            to: 'in_progress',
            type: 'for_probands',
            expect: { status: StatusCodes.OK, releaseVersion: 0 },
          },
          {
            from: 'in_progress',
            to: 'released_once',
            type: 'for_probands',
            expect: { status: StatusCodes.OK, releaseVersion: 1 },
          },
          {
            from: 'active',
            to: 'released_once',
            type: 'for_probands',
            expect: { status: StatusCodes.OK, releaseVersion: 1 },
          },
          {
            from: 'released_once',
            to: 'released_twice',
            type: 'for_probands',
            expect: { status: StatusCodes.OK, releaseVersion: 2 },
          },
        ];

        for (const testCase of testCases) {
          it(`should return ${testCase.expect.status} when transitioning from ${testCase.from} to ${testCase.to} for questionnaire type ${testCase.type}`, async () => {
            // Arrange
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            await setQuestionnaireInstanceStatus(
              questionnaires.StudyA.stya0000000001.questionnaire_b.instanceId,
              testCase.from
            );
            await setQuestionnaireType(
              questionnaires.StudyA.stya0000000001.questionnaire_b.id,
              testCase.type
            );

            // Act
            const response = await http
              .patch(
                sprintPath(
                  pathQuestionnaireInstance,
                  questionnaires.StudyA.stya0000000001.questionnaire_b
                )
              )
              .set(apiClientHeader)
              .send({ status: testCase.to });

            // Assert
            if (testCase.expect.status === StatusCodes.OK) {
              expect(response).to.have.status(testCase.expect.status);
              expect(response.body).to.deep.equal({
                status: testCase.to,
                progress: 100,
                releaseVersion: testCase.expect.releaseVersion,
              });
            } else {
              expect(response).to.failWithError({
                statusCode: StatusCodes.BAD_REQUEST,
                message: `A transition from '${testCase.from}' to '${testCase.to}' is not allowed`,
              });
            }
          });
        }
      });
    });
  });

  describe(`POST ${pathIdentifier}/answers`, () => {
    describe('should return 200', () => {
      it('when adding initial answers and set questionnaire instance status to "in_progress"', async () => {
        // Arrange
        const expectedStatus: QuestionnaireInstanceStatus = 'in_progress';
        const answers: PostAnswerRequestDto[] = getCompletePostAnswersRequest();

        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(answers);

        // Assert
        expect(response).to.have.status(StatusCodes.OK);
        expect(response.body).to.have.lengthOf(answers.length);
        expect(response.body).answersToMatch(answers, 1);

        const qi = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(
            questionnaires.StudyA.stya0000000001.questionnaire_a.instanceId,
            {
              relations: [
                'answers',
                'answers.question',
                'answers.answerOption',
              ],
            }
          );

        expect(qi.status).to.equal(expectedStatus);
        expect(qi.releaseVersion).to.equal(0);
        expect(qi.answers).to.have.lengthOf(
          answers.length,
          'Answers have not been added'
        );
      });

      it('and update questionnaire instance with calculated progress', async () => {
        const segments = questionnaires.StudyA.stya0000000001.questionnaire_a;

        // Arrange
        const testCases = [
          {
            expectedProgress: 50,
            answers: [
              answerQ1A1,
              answerQ1A2,
              answerQ1A3,
              answerQ1A4,
              answerQ1A5,
              { ...answerQ2A6, value: null },
              { ...answerQ2A7, value: null },
              { ...answerQ2A8, value: null },
              { ...answerQ2A9, value: null },
              { ...answerQ2A10, value: null },
            ],
          },
          {
            expectedProgress: 70,
            answers: [
              answerQ1A1,
              answerQ1A2,
              answerQ1A3,
              answerQ1A4,
              answerQ1A5,
              answerQ2A6,
              answerQ2A7,
              { ...answerQ2A8, value: null },
              { ...answerQ2A9, value: null },
              { ...answerQ2A10, value: null },
            ],
          },
          {
            expectedProgress: 100,
            answers: getCompletePostAnswersRequest(),
          },
        ];

        // Act
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        for (const testCase of testCases) {
          AuthServerMock.adminRealm().returnValid();
          const response = await http
            .post(sprintPath(pathQuestionnaireInstanceAnswers, segments))
            .set(apiClientHeader)
            .send(testCase.answers);

          // Assert
          expect(response).to.have.status(StatusCodes.OK);
          const qi = await getConnection()
            .getRepository(QuestionnaireInstance)
            .findOne(segments.instanceId);

          expect(qi.progress).to.equal(testCase.expectedProgress);
        }
      });

      it('and update existing answers while keeping status "in_progress"', async () => {
        // Arrange
        const expectedStatus: QuestionnaireInstanceStatus = 'in_progress';
        const answers: PostAnswerRequestDto[] = getCompletePostAnswersRequest();

        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyB.styb0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(answers);

        // Assert
        expect(response).to.have.status(StatusCodes.OK);
        expect(response.body).to.have.lengthOf(answers.length);
        expect(response.body).answersToMatch(answers, 1);

        const qi = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(
            questionnaires.StudyB.styb0000000001.questionnaire_a.instanceId,
            {
              relations: [
                'answers',
                'answers.question',
                'answers.answerOption',
              ],
            }
          );

        expect(qi.status).to.equal(expectedStatus);
        expect(qi.releaseVersion).to.equal(0);
        expect(qi.answers).to.have.lengthOf(
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          10,
          'Answers have been added instead of updated'
        );
      });

      it('and update progress, even when questionnaire instance has been released', async () => {
        // Arrange
        const { instanceId } =
          questionnaires.StudyB.styb0000000001.questionnaire_a_released_once;

        const qiBefore = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(instanceId);

        expect(qiBefore.progress).to.not.equal(
          100,
          'Progress should not be at 100%'
        );

        //Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyB.styb0000000001.questionnaire_a_released_once
            )
          )
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        expect(response).to.have.status(StatusCodes.OK);

        const qiAfter = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(instanceId);

        expect(qiAfter.progress).to.equal(100, 'Progress should be at 100%');
      });

      it('and create correctly versioned answer for researcher questionnaire', async () => {
        // Arrange
        const expectedStatus: QuestionnaireInstanceStatus = 'released';
        const initialAnswers: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();
        const changedAnswersFirstRelease: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();
        const changedAnswersSecondRelease: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();

        // Act
        // > Create initial answers on active instance
        const firstResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(initialAnswers);

        // > Release questionnaire which should now be in progress after posting answers
        AuthServerMock.adminRealm().returnValid();
        await http
          .patch(
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send({ status: expectedStatus });

        // > Post new answers for next release
        AuthServerMock.adminRealm().returnValid();
        const secondResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(changedAnswersFirstRelease);

        AuthServerMock.adminRealm().returnValid();
        const thirdResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(changedAnswersSecondRelease);

        // Assert
        for (const { expectedVersion, response } of [
          { expectedVersion: 1, response: firstResponse },
          { expectedVersion: 2, response: secondResponse },
          { expectedVersion: 2, response: thirdResponse },
        ]) {
          expect(response).to.have.status(StatusCodes.OK);
          expect(response.body).to.have.lengthOf(initialAnswers.length);
          expect(response.body).answersToMatch(
            changedAnswersFirstRelease,
            expectedVersion
          );
        }

        const qi = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(
            questionnaires.StudyA.stya0000000001.questionnaire_a.instanceId,
            {
              relations: [
                'answers',
                'answers.question',
                'answers.answerOption',
              ],
            }
          );

        const numAnswersVersion1 = qi.answers.filter((a) => a.versioning === 1);
        const numAnswersVersion2 = qi.answers.filter((a) => a.versioning === 2);
        expect(qi.status).to.equal(expectedStatus);
        expect(qi.releaseVersion).to.equal(1);
        expect(numAnswersVersion1).to.have.lengthOf(10);
        expect(numAnswersVersion2).to.have.lengthOf(10);
      });

      it('and create correctly versioned answer for participant questionnaire', async () => {
        // Arrange
        const expectedStatus: QuestionnaireInstanceStatus = 'released_once';

        const initialAnswers: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();
        const changedAnswersFirstRelease: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();
        const changedAnswersSecondRelease: PostAnswerRequestDto[] =
          getCompletePostAnswersRequest();

        await setQuestionnaireType(
          questionnaires.StudyA.stya0000000001.questionnaire_a.id,
          'for_probands'
        );

        // Act
        // > Create initial answers on active instance
        const firstResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(initialAnswers);

        // > Release questionnaire which should now be in progress after posting answers
        AuthServerMock.adminRealm().returnValid();
        await http
          .patch(
            sprintPath(
              pathQuestionnaireInstance,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send({ status: expectedStatus });

        // > Post new answers for next release
        AuthServerMock.adminRealm().returnValid();
        const secondResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(changedAnswersFirstRelease);

        AuthServerMock.adminRealm().returnValid();
        const thirdResponse = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(changedAnswersSecondRelease);

        // Assert
        for (const { expectedVersion, response } of [
          { expectedVersion: 1, response: firstResponse },
          { expectedVersion: 2, response: secondResponse },
          { expectedVersion: 2, response: thirdResponse },
        ]) {
          expect(response).to.have.status(StatusCodes.OK);
          expect(response.body).to.have.lengthOf(initialAnswers.length);

          const body = response.body as PostAnswerResponseDto[];
          expect(body).answersToMatch(
            changedAnswersFirstRelease,
            expectedVersion
          );
        }

        const qi = await getConnection()
          .getRepository(QuestionnaireInstance)
          .findOne(
            questionnaires.StudyA.stya0000000001.questionnaire_a.instanceId,
            {
              relations: [
                'answers',
                'answers.question',
                'answers.answerOption',
              ],
            }
          );

        const numAnswersVersion1 = qi.answers.filter((a) => a.versioning === 1);
        const numAnswersVersion2 = qi.answers.filter((a) => a.versioning === 2);
        expect(qi.status).to.equal(expectedStatus);
        expect(qi.releaseVersion).to.equal(1);
        expect(numAnswersVersion1).to.have.lengthOf(10);
        expect(numAnswersVersion2).to.have.lengthOf(10);
      });

      it('when optional questions have empty answer values', async () => {
        // Arrange
        const answers: PostAnswerRequestDto[] = [
          answerQ1A1,
          answerQ1A2,
          answerQ1A3,
          answerQ1A4,
          answerQ1A5,
          { ...answerQ2A6, value: null },
          { ...answerQ2A7, value: null },
          { ...answerQ2A8, value: null },
          { ...answerQ2A9, value: null },
          { ...answerQ2A10, value: null },
        ];

        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(answers);

        expect(response).to.have.status(StatusCodes.OK);
        expect(response.body).to.have.lengthOf(answers.length);
        expect(response.body).answersToMatch(answers, 1);

        const countAnswers = await getConnection()
          .getRepository(Answer)
          .count({
            where: {
              questionnaireInstance:
                questionnaires.StudyB.styb0000000001.questionnaire_a.instanceId,
            },
          });

        expect(countAnswers).to.equal(
          answers.length,
          'Count of added answers is incorrect'
        );
      });

      context('when using custom name', () => {
        it('adding initial answers and set questionnaire instance status to "in_progress"', async () => {
          // Arrange
          const segments = questionnaires.StudyA.stya0000000001.questionnaire_a;
          const expectedStatus: QuestionnaireInstanceStatus = 'in_progress';
          const answers: PostAnswerRequestDto[] =
            getCompletePostAnswersRequest();

          // Act
          const response = await http
            .post(
              sprintPath(pathQuestionnaireInstanceAnswers, {
                ...segments,
                instanceId: segments.instanceId,
              })
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.have.status(StatusCodes.OK);
          expect(response.body).to.have.lengthOf(answers.length);
          expect(response.body).answersToMatch(answers, 1);

          const qi = await getConnection()
            .getRepository(QuestionnaireInstance)
            .findOne(segments.instanceId, {
              relations: [
                'answers',
                'answers.question',
                'answers.answerOption',
              ],
            });

          expect(qi.status).to.equal(expectedStatus);
          expect(qi.releaseVersion).to.equal(0);
          expect(qi.answers).to.have.lengthOf(
            answers.length,
            'Answers have not been added'
          );
        });
      });
    });

    describe('errors', () => {
      it('should return 401 if no auth token is appended', async () => {
        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .send(getCompletePostAnswersRequest());

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 401 if auth token is invalid', async () => {
        // Arrange
        AuthServerMock.cleanAll();
        AuthServerMock.adminRealm().returnInvalid();

        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        // Assert
        expect(response).to.have.an.failWithInvalidToken();
      });

      it('should return 403 if API client does not have study access', async () => {
        // Act
        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyX.styx0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        // Assert
        expect(response).to.have.failWithNoStudyAccessFor('Study X');
      });

      it('should return 403 when a sample ID is given, but participant compliance for samples is not true', async () => {
        sampletrackingserviceClientStub.throws(
          Boom.internal('', '', StatusCodes.FORBIDDEN)
        );

        const response = await http
          .post(
            sprintPath(
              pathQuestionnaireInstanceAnswers,
              questionnaires.StudyA.stya0000000001.questionnaire_a
            )
          )
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        expect(response).to.failWithError({
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
          message: `Found sample ID in answers, but the participant did not comply to track samples`,
        });
      });

      it('should return 404 if the study does not exist', async function () {
        const segments =
          questionnaires.DoesNotExist.DoesNotExist0000000001.questionnaire_a;

        userserviceClientStub.resolves(null);

        const response = await http
          .post(sprintPath(pathQuestionnaireInstanceAnswers, segments))
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        expect(response).to.failWithStudyNotFound(segments.studyName);
      });

      it('should return 404 if the questionnaire does not exist', async function () {
        const segments = questionnaires.StudyA.stya0000000001.does_not_exist;

        const response = await http
          .post(sprintPath(pathQuestionnaireInstanceAnswers, segments))
          .set(apiClientHeader)
          .send(getCompletePostAnswersRequest());

        expect(response).to.failWithError({
          statusCode: StatusCodes.NOT_FOUND,
          message: `A questionnaire instance for a questionnaire with id "${segments.instanceId}" does not exist`,
        });
      });

      describe('should return 422 when', () => {
        it('invalid answer values in relation to answer type are given', async () => {
          // Arrange
          const answers = [
            { ...answerQ1A1, value: '1' },
            { ...answerQ1A2, value: '0;1' },
            { ...answerQ1A3, value: '9' },
            { ...answerQ1A4, value: 2 },
            { ...answerQ1A5, value: 'the first of july 2023' },
            { ...answerQ2A6, value: '0' },
            { ...answerQ2A7, value: JPEG_BASE64 },
            { ...answerQ2A8, value: 'SAMPLE-123456789' },
            { ...answerQ2A9, value: 5678 },
            { ...answerQ2A10, value: 1 },
          ];

          const expectedMissingAnswers = [
            `${answerQ1A1.questionVariableName}.${answerQ1A1.answerOptionVariableName} --> expected: number`,
            `${answerQ1A2.questionVariableName}.${answerQ1A2.answerOptionVariableName} --> expected: number[]`,
            `${answerQ1A3.questionVariableName}.${answerQ1A3.answerOptionVariableName} --> expected: number`,
            `${answerQ1A4.questionVariableName}.${answerQ1A4.answerOptionVariableName} --> expected: string`,
            `${answerQ1A5.questionVariableName}.${answerQ1A5.answerOptionVariableName} --> expected: ISO 8601 date`,
            `${answerQ2A6.questionVariableName}.${answerQ2A6.answerOptionVariableName} --> expected: number`,
            `${answerQ2A7.questionVariableName}.${answerQ2A7.answerOptionVariableName} --> expected: UserFileDto`,
            `${answerQ2A8.questionVariableName}.${answerQ2A8.answerOptionVariableName} --> expected: SampleDto`,
            `${answerQ2A9.questionVariableName}.${answerQ2A9.answerOptionVariableName} --> expected: string`,
            `${answerQ2A10.questionVariableName}.${answerQ2A10.answerOptionVariableName} --> expected: ISO 8601 timestamp`,
          ];

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              expectedMissingAnswers.join('\n') +
              '\n',
          });
        });

        it('payload is an empty array', async function () {
          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send([]);

          // Assert
          expect(response).to.failWithInvalidPayload(
            'answersDto: [] --> no answers provided'
          );
        });

        it('questionnaire instance status does not allow writing answers', async () => {
          // Arrange
          const status: QuestionnaireInstanceStatus = 'inactive';
          await setQuestionnaireInstanceStatus(
            questionnaires.StudyA.stya0000000001.questionnaire_a.instanceId,
            status
          );

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(getCompletePostAnswersRequest());

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
            message: `Questionnaire instance status is "${status}" and does not allow to write answers`,
          });
        });

        it('when a sample ID and/or dummy ID are given, but there is no lab result', async () => {
          sampletrackingserviceClientStub.throws(
            Boom.internal('', '', StatusCodes.NOT_FOUND)
          );

          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(getCompletePostAnswersRequest());

          expect(response).to.failWithError({
            statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
            message: `The given sample ID and/or sample dummy ID did not match any lab result`,
          });
        });

        it('when a sample ID is given, but the sample dummy ID did not match lab result', async () => {
          sampletrackingserviceClientStub.throws(
            Boom.internal('', '', StatusCodes.UNPROCESSABLE_ENTITY)
          );

          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(getCompletePostAnswersRequest());

          expect(response).to.failWithError({
            statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
            message: `The given sample dummy ID did not match the found lab result`,
          });
        });
      });

      describe('should return 412 when', () => {
        it('answer are missing', async () => {
          // Arrange
          const answers = [
            answerQ1A1,
            answerQ1A3,
            answerQ1A4,
            answerQ1A5,
            answerQ2A6,
            answerQ2A8,
            answerQ2A9,
            answerQ2A10,
          ];
          const expectedMissingAnswers = [
            `${answerQ1A2.questionVariableName}.${answerQ1A2.answerOptionVariableName} --> missing`,
            `${answerQ2A7.questionVariableName}.${answerQ2A7.answerOptionVariableName} --> missing`,
          ];

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              expectedMissingAnswers.join('\n') +
              '\n',
          });
        });

        it('answers of a question enabled by a condition are missing', async () => {
          // Arrange
          const answers = [
            answerQ1A1,
            answerQ1A2,
            answerQ1A3,
            answerQ1A4,
            answerQ1A5,
            { ...answerQ2A6, value: 1 }, // enables answerQ2A11
            answerQ2A7,
            answerQ2A8,
            answerQ2A9,
            answerQ2A10,
          ];

          const expectedMissingAnswers = `${answerQ2A11.questionVariableName}.${answerQ2A11.answerOptionVariableName} --> missing`;

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              `${expectedMissingAnswers}\n`,
          });
        });

        it('answers of a question disabled by a condition are given', async () => {
          // Arrange
          const answers = [
            answerQ1A1,
            answerQ1A2,
            answerQ1A3,
            answerQ1A4,
            answerQ1A5,
            answerQ2A6,
            answerQ2A7,
            answerQ2A8,
            answerQ2A9,
            answerQ2A10,
            answerQ2A11,
          ];

          const expectedUnavailableQuestion = `${answerQ2A11.questionVariableName}.${answerQ2A11.answerOptionVariableName} --> not available`;

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              expectedUnavailableQuestion +
              '\n',
          });
        });

        it('answers which have no corresponding question/answer option are given', async () => {
          // Arrange
          const answers = [
            answerQ1A1,
            answerQ1A2,
            answerQ1A3,
            answerQ1A4,
            {
              questionVariableName: 'does_not_exist',
              answerOptionVariableName: 'does_not_exist_either',
              value: 'foobar',
            },
            answerQ1A5,
            answerQ2A6,
            answerQ2A7,
            answerQ2A8,
            answerQ2A9,
            answerQ2A10,
          ];

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The questionnaire has no question/answer option for does_not_exist.does_not_exist_either',
          });
        });

        it('answer values failed restrictions or does not match possible choices', async () => {
          // Arrange
          const answers = [
            { ...answerQ1A1, value: 3 },
            { ...answerQ1A2, value: [89, 1] },
            { ...answerQ1A3, value: 11 },
            answerQ1A4,
            {
              ...answerQ1A5,
              value: formatISO(addDays(new Date(), 8), {
                representation: 'date',
              }),
            },
            answerQ2A6,
            answerQ2A7,
            answerQ2A8,
            answerQ2A9,
            {
              ...answerQ2A10,
              value: formatISO(subDays(new Date(), 3)),
            },
          ];

          const expectedMissingAnswers = [
            `${answerQ1A1.questionVariableName}.${answerQ1A1.answerOptionVariableName} --> expected: to match one of 1, 0`,
            `${answerQ1A2.questionVariableName}.${answerQ1A2.answerOptionVariableName} --> expected: to match one or more of 99, 1, 0`,
            `${answerQ1A3.questionVariableName}.${answerQ1A3.answerOptionVariableName} --> expected: number between 1 and 10`,
            `${answerQ1A5.questionVariableName}.${answerQ1A5.answerOptionVariableName} --> expected: date between -7 and 7 days from today`,
          ];

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              `${expectedMissingAnswers.join('\n')}\n`,
          });
        });

        it('answers for mandatory question are empty', async () => {
          // Arrange
          const answers = [
            { ...answerQ1A1, value: [] },
            { ...answerQ1A2, value: [] },
            answerQ1A3,
            { ...answerQ1A4, value: '' },
            answerQ1A5,
            answerQ2A6,
            answerQ2A7,
            answerQ2A8,
            answerQ2A9,
            answerQ2A10,
          ];

          const expectedMissingAnswers = [
            `${answerQ1A1.questionVariableName}.${answerQ1A1.answerOptionVariableName} --> mandatory`,
            `${answerQ1A2.questionVariableName}.${answerQ1A2.answerOptionVariableName} --> mandatory`,
            `${answerQ1A4.questionVariableName}.${answerQ1A4.answerOptionVariableName} --> mandatory`,
          ];

          // Act
          const response = await http
            .post(
              sprintPath(
                pathQuestionnaireInstanceAnswers,
                questionnaires.StudyA.stya0000000001.questionnaire_a
              )
            )
            .set(apiClientHeader)
            .send(answers);

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.PRECONDITION_FAILED,
            message:
              'The following answers are not valid:\n' +
              `${expectedMissingAnswers.join('\n')}\n`,
          });
        });
      });

      context('custom name', () => {
        it('should return 403 when questionnaire instance is recurring', async () => {
          // Arrange
          const segments = questionnaires.StudyA.stya0000000001.questionnaire_a;
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          await setQuestionnaireCycleUnit(100, 'day');

          // Act
          const response = await http
            .post(
              sprintPath(pathQuestionnaireInstanceAnswers, {
                ...segments,
                instanceId: segments.questionnaireCustomName,
              })
            )
            .set(apiClientHeader)
            .send(getCompletePostAnswersRequest());

          // Assert
          expect(response).to.failWithError({
            statusCode: StatusCodes.FORBIDDEN,
            message:
              'The questionnaire for the selected instance is recurring and does not create a single, unique questionnaire instance.',
          });
        });

        it('should return 404 if the questionnaire does not exist', async function () {
          const segments = questionnaires.StudyA.stya0000000001.does_not_exist;

          const response = await http
            .post(
              sprintPath(pathQuestionnaireInstanceAnswers, {
                ...segments,
                instanceId: segments.questionnaireCustomName,
              })
            )
            .set(apiClientHeader)
            .send(getCompletePostAnswersRequest());

          expect(response).to.failWithError({
            statusCode: StatusCodes.NOT_FOUND,
            message: `A questionnaire instance for a questionnaire with the custom name "${segments.questionnaireCustomName}" does not exist`,
          });
        });
      });
    });
  });
});

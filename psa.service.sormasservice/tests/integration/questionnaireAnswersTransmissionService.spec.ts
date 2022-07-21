/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import sinon from 'sinon';

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import fetchMocker, { MockOptions } from 'fetch-mock';
import { StatusCodes } from 'http-status-codes';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  Producer,
} from '@pia/lib-messagequeue';

import { config } from '../../src/config';
import { MessagePayloadQuestionnaireInstanceReleased } from '../../src/models/messagePayloads';
import { messageQueueService } from '../../src/services/messageQueueService';
import { Server } from '../../src/server';
import {
  createAnswer,
  createAnswerOption,
  createQuestionnaireInstance,
} from './instanceCreator.helper';
import { TaskScheduler } from '../../src/services/taskScheduler';
import { ExternalVisitDto } from '../../src/models/externalVisitDto';
import { expect } from 'chai';
import { getRepository, Repository } from 'typeorm';
import { SymptomTransmission } from '../../src/entities/symptomTransmission';
import { Answer } from '../../src/models/answer';
import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';
import { Bool3, TemperatureSource } from '../../src/models/symptomsDto';
import { AnswerType } from '../../src/models/answerOption';

const BOOL3_NO = 0,
  BOOL3_YES = 1,
  BOOL3_UNKNOWN = 2;

const TEMPSOURCE_NON_CONTACT = 1,
  TEMPSOURCE_ORAL = 2,
  TEMPSOURCE_AXILLARY = 3,
  TEMPSOURCE_RECTAL = 4;

describe('QuestionnaireAnswersTransmissionService integration', function () {
  const fetchMock = fetchMocker.sandbox();
  const testSandbox = sinon.createSandbox();
  const suiteSandbox = sinon.createSandbox();
  const mqc = new MessageQueueClient(config.servers.messageQueue);
  let transmissionRepo: Repository<SymptomTransmission>;

  before(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    suiteSandbox.stub(TaskScheduler, 'init');
    suiteSandbox.stub(TaskScheduler, 'stop');
    await mqc.connect(true);
    await Server.init();
    transmissionRepo = getRepository(SymptomTransmission);
  });

  after(async () => {
    await Server.stop();
    await mqc.disconnect();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    fetchMock.catch(StatusCodes.SERVICE_UNAVAILABLE);
  });

  afterEach(() => {
    testSandbox.restore();
    fetchMock.restore();
  });

  describe('onQuestionnaireInstanceReleased', () => {
    let producer: Producer<MessagePayloadQuestionnaireInstanceReleased>;
    const user = {
      pseudonym: 'qtest-1234567890',
      ids: 'test-uuid',
    };
    let processedQuestionnaireInstanceReleased: Promise<void>;

    beforeEach(async () => {
      processedQuestionnaireInstanceReleased =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          'questionnaire_instance.released',
          testSandbox
        );

      producer =
        await mqc.createProducer<MessagePayloadQuestionnaireInstanceReleased>(
          'questionnaire_instance.released'
        );
    });

    afterEach(async () => {
      await transmissionRepo.clear();
    });

    it('should be triggered by questionnaire_instance.released', async () => {
      // Arrange
      // Act
      await producer.publish({ id: 9100, releaseVersion: 1 });
      await processedQuestionnaireInstanceReleased;
    });
    // it('should find and NOT upload bad questionnaire instances', async () => {});

    it('should upload questionnaire instances v1 with correct data, and save transmission date', async () => {
      // Arrange
      const version = 1;
      const qi = createQuestionnaireInstance({
        id: 9100,
        studyId: config.sormas.study,
        status: 'released_once',
        pseudonym: user.pseudonym,
      });
      const answers = [
        createAnswer({
          value: 'Lorem ipsum dolor.',
          answerOption: createAnswerOption({ label: 'symptomsComments' }),
        }),
        createAnswer({
          value: 'It hurts',
          answerOption: createAnswerOption({
            label: 'headache',
            answerTypeId: AnswerType.SingleSelect,
            values: ['Everything ok', 'It hurts', 'I do not know'],
            valuesCode: [BOOL3_NO, BOOL3_YES, BOOL3_UNKNOWN],
          }),
        }),
      ];

      const questionnaireInstancesRequest =
        createQuestionnaireInstanceRequest(qi);
      const idsRequest = createIdsRequest(user.ids, user.pseudonym);
      const answersRequest = createAnswersRequest(qi.id, answers);
      const sormasUploadRequest = createSormasUploadRequest();

      fetchMock
        .mock(questionnaireInstancesRequest)
        .mock(idsRequest)
        .mock(answersRequest)
        .mock(sormasUploadRequest);

      // Act
      await producer.publish({ id: qi.id, releaseVersion: version });
      await processedQuestionnaireInstanceReleased;

      // Assert
      expect(fetchMock.called(undefined, questionnaireInstancesRequest)).to.be
        .true;
      expect(fetchMock.called(undefined, idsRequest)).to.be.true;
      expect(fetchMock.called(undefined, answersRequest)).to.be.true;

      const sormasRequestCall = fetchMock.lastCall(
        undefined,
        sormasUploadRequest
      );
      expect(sormasRequestCall).to.not.be.undefined;
      const sormasRequestBody = JSON.parse(
        sormasRequestCall![1]!.body as string
      ) as ExternalVisitDto[];
      expect(sormasRequestBody).to.be.an('array').and.to.have.length(1);
      const expectedExternalVisit: ExternalVisitDto = {
        personUuid: user.ids,
        visitStatus: 'COOPERATIVE',
        visitRemarks: 'Version ' + version.toString(),
        disease: 'CORONAVIRUS',
        symptoms: {
          symptomsComments: 'Lorem ipsum dolor.',
          headache: Bool3.YES,
        },
      };
      expect(sormasRequestBody[0]).to.deep.include(expectedExternalVisit);
      const transmission = await transmissionRepo.findOneOrFail({
        pseudonym: user.pseudonym,
        study: config.sormas.study,
        questionnaireInstanceId: qi.id,
        version: version,
      });
      expect(transmission.transmissionDate).to.be.an.instanceof(Date);
    });

    it('should upload questionnaire instances v2 with correct data, and save transmission date', async () => {
      // Arrange
      const version = 2;
      const qi = createQuestionnaireInstance({
        id: 9100,
        studyId: config.sormas.study,
        status: 'released_twice',
        pseudonym: user.pseudonym,
      });
      const answers = [
        createAnswer({
          value: '38.5',
          answerOption: createAnswerOption({ label: 'temperature' }),
        }),
        createAnswer({
          value: 'under the axles',
          answerOption: createAnswerOption({
            label: 'temperatureSource',
            answerTypeId: AnswerType.SingleSelect,
            values: [
              'infrared',
              'in the mouth',
              'under the axles',
              'in the butt',
            ],
            valuesCode: [
              TEMPSOURCE_NON_CONTACT,
              TEMPSOURCE_ORAL,
              TEMPSOURCE_AXILLARY,
              TEMPSOURCE_RECTAL,
            ],
          }),
        }),
      ];

      const questionnaireInstancesRequest =
        createQuestionnaireInstanceRequest(qi);
      const idsRequest = createIdsRequest(user.ids, user.pseudonym);
      const answersRequest = createAnswersRequest(qi.id, answers);
      const sormasUploadRequest = createSormasUploadRequest();

      fetchMock
        .mock(questionnaireInstancesRequest)
        .mock(idsRequest)
        .mock(answersRequest)
        .mock(sormasUploadRequest);

      // Act
      await producer.publish({ id: qi.id, releaseVersion: version });
      await processedQuestionnaireInstanceReleased;

      // Assert
      expect(fetchMock.called(undefined, questionnaireInstancesRequest)).to.be
        .true;
      expect(fetchMock.called(undefined, idsRequest)).to.be.true;
      expect(fetchMock.called(undefined, answersRequest)).to.be.true;

      const sormasRequestCall = fetchMock.lastCall(
        undefined,
        sormasUploadRequest
      );
      expect(sormasRequestCall).to.not.be.undefined;
      const sormasRequestBody = JSON.parse(
        sormasRequestCall![1]!.body as string
      ) as ExternalVisitDto[];
      expect(sormasRequestBody).to.be.an('array').and.to.have.length(1);
      const expectedExternalVisit: ExternalVisitDto = {
        personUuid: user.ids,
        visitStatus: 'COOPERATIVE',
        visitRemarks: 'Version ' + version.toString(),
        disease: 'CORONAVIRUS',
        symptoms: {
          temperature: 38.5,
          temperatureSource: TemperatureSource.AXILLARY,
        },
      };
      expect(sormasRequestBody[0]).to.deep.include(expectedExternalVisit);
      const transmission = await transmissionRepo.findOneOrFail({
        pseudonym: user.pseudonym,
        study: config.sormas.study,
        questionnaireInstanceId: qi.id,
        version: version,
      });
      expect(transmission.transmissionDate).to.be.an.instanceof(Date);
    });

    it('should mark an instance without symptoms (e.g. user experience) as transmitted without sending it to sormas', async () => {
      // Arrange
      const version = 1;
      const qi = createQuestionnaireInstance({
        id: 9100,
        studyId: config.sormas.study,
        status: 'released_once',
        pseudonym: user.pseudonym,
      });
      const answers = [
        createAnswer({
          value: 'This is a marvelous software.',
          answerOption: createAnswerOption({ label: 'user_experience' }),
        }),
        createAnswer({
          value: 'Very Good',
          answerOption: createAnswerOption({
            label: null,
            answerTypeId: AnswerType.SingleSelect,
            values: ['very good', 'good', 'ok', 'bad', 'very bad'],
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            valuesCode: [1, 2, 3, 4, 5],
          }),
        }),
      ];

      const questionnaireInstancesRequest =
        createQuestionnaireInstanceRequest(qi);
      const idsRequest = createIdsRequest(user.ids, user.pseudonym);
      const answersRequest = createAnswersRequest(qi.id, answers);
      const sormasUploadRequest = createSormasUploadRequest();

      fetchMock
        .mock(questionnaireInstancesRequest)
        .mock(idsRequest)
        .mock(answersRequest);

      // Act
      await producer.publish({ id: qi.id, releaseVersion: version });
      await processedQuestionnaireInstanceReleased;

      // Assert
      expect(fetchMock.called(undefined, questionnaireInstancesRequest)).to.be
        .true;
      expect(fetchMock.called(undefined, idsRequest)).to.be.true;
      expect(fetchMock.called(undefined, answersRequest)).to.be.true;
      expect(fetchMock.called(undefined, sormasUploadRequest)).to.be.false;
      const transmission = await transmissionRepo.findOneOrFail({
        pseudonym: user.pseudonym,
        study: config.sormas.study,
        questionnaireInstanceId: qi.id,
        version: version,
      });
      expect(transmission.transmissionDate).to.be.an.instanceof(Date);
    });
  });
});

function createQuestionnaireInstanceRequest(
  qi: QuestionnaireInstance
): MockOptions {
  return {
    method: 'GET',
    matcher: 'express:/questionnaire/questionnaireInstances/:id',
    params: {
      id: qi.id.toString(),
    },
    response: {
      body: qi,
    },
  };
}

function createIdsRequest(ids: string, pseudonym: string): MockOptions {
  return {
    method: 'GET',
    matcher: 'express:/user/users/:pseudonym/ids',
    params: {
      pseudonym: pseudonym,
    },
    response: ids,
  };
}

function createAnswersRequest(qiId: number, answers: Answer[]): MockOptions {
  return {
    method: 'GET',
    matcher: 'express:/questionnaire/questionnaireInstances/:id/answers',
    params: {
      id: qiId.toString(),
    },
    response: {
      body: answers,
    },
  };
}

function createSormasUploadRequest(): MockOptions {
  return {
    method: 'POST',
    matcher: 'express:/sormas-rest/visits-external/',
    matchPartialBody: true,
    response: {
      body: ['OK'],
    },
  };
}

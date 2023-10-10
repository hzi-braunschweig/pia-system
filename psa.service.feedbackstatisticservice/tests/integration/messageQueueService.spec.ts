/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import { expect, use } from 'chai';
import chaiAlmost from 'chai-almost';
import * as sinon from 'sinon';
import fetchMocker from 'fetch-mock';
import { Server } from '../../src/server';
import {
  FeedbackStatisticConfigurationUpdatedMessage,
  messageQueueService,
  StudyDeletedMessage,
} from '../../src/services/messageQueueService';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
  Producer,
} from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import { getRepository } from 'typeorm';
import {
  FeedbackStatistic,
  FeedbackStatisticStatus,
} from '../../src/entities/feedbackStatistic';
import {
  FeedbackStatisticConfiguration,
  FeedbackStatisticVisibility,
} from '../../src/entities/feedbackStatisticConfiguration';
import { FeedbackStatisticType } from '../../src/entities/specificFeedbackStatistics';
import { RelativeFrequencyTimeSeriesConfiguration } from '../../src/entities/relativeFrequencyTimeSeriesConfiguration';
import { TimeSpanUnit } from '../../src/model/timeSpan';
import {
  AnswerType,
  HttpClient,
  QuestionnaireInternalDto,
} from '@pia-system/lib-http-clients-internal';
import { DeepPartial } from 'ts-essentials';
import { Readable } from 'stream';
import { utcToZonedTime } from 'date-fns-tz';
import ReadableStream = NodeJS.ReadableStream;
import * as os from 'os';

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
use(chaiAlmost(3));

function utcToLocalTime(date: string): string {
  return utcToZonedTime(new Date(date), 'Europe/Berlin').toISOString();
}

describe('MessageQueueService', () => {
  const fetchMock = fetchMocker.sandbox();
  const testSandbox = sinon.createSandbox();

  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async () => {
    await Server.init();
    await mqc.connect(true);
  });

  after(async function () {
    await mqc.disconnect();
    await Server.stop();
  });

  beforeEach(() => {
    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
  });

  afterEach(() => {
    fetchMock.restore();
    testSandbox.restore();
  });

  describe('Consume study.deleted', () => {
    const topic = MessageQueueTopic.STUDY_DELETED;
    let producer: Producer<StudyDeletedMessage>;
    let processedStudyDeleted: Promise<void>;

    beforeEach(async () => {
      producer = await mqc.createProducer(topic);
      processedStudyDeleted =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          topic,
          testSandbox
        );
    });

    it('should delete all feedback statistics of deleted study', async () => {
      // Arrange
      await setupPendingFeedbackStatistic();

      // Act
      await producer.publish({ studyName: 'Teststudy' });
      await processedStudyDeleted;

      const feedbackStatistic = await getRepository(FeedbackStatistic).findOne(
        1
      );
      const feedbackStatisticConfiguration = await getRepository(
        FeedbackStatisticConfiguration
      ).findOne(1);

      // Assert
      expect(feedbackStatistic).to.be.undefined;
      expect(feedbackStatisticConfiguration).to.be.undefined;
    });
  });

  describe('Consume feedbackstatistic_configuration.updated', () => {
    const topic = MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED;
    let producer: Producer<FeedbackStatisticConfigurationUpdatedMessage>;
    let processedConfigurationUpdated: Promise<void>;

    beforeEach(async () => {
      producer = await mqc.createProducer(topic);
      processedConfigurationUpdated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          topic,
          testSandbox
        );

      fetchMock.get(
        'glob:http://questionnaireservice:5001/questionnaire/123/1',
        createQuestionnaire()
      );

      fetchMock.get(
        'glob:http://questionnaireservice:5001/questionnaire/123/answers?*',
        createAnswersReadable(),
        {
          sendAsJson: false,
        }
      );
    });

    it('should update feedback statistic data for given configuration', async () => {
      // Arrange
      await setupFeedbackStatisticConfiguration();

      // Act
      await producer.publish({ configurationId: 2 });
      await processedConfigurationUpdated;
      const feedbackStatistic = await getRepository(FeedbackStatistic).findOne(
        2
      );

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      expect(feedbackStatistic).to.be.deep.almost({
        configurationId: 2,
        study: 'Teststudy',
        status: 'has_data',
        data: [
          {
            color: '#123456',
            label: 'yes',
            intervals: [
              {
                timeRange: {
                  startDate: utcToLocalTime('2022-12-26T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-02T07:00:00.000Z'),
                },
                value: 100,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-02T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-09T07:00:00.000Z'),
                },
                value: 66,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-09T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-16T07:00:00.000Z'),
                },
                value: 0,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-16T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-23T07:00:00.000Z'),
                },
                value: 0,
              },
            ],
          },
          {
            color: '#123457',
            label: 'no',
            intervals: [
              {
                timeRange: {
                  startDate: utcToLocalTime('2022-12-26T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-02T07:00:00.000Z'),
                },
                value: 0,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-02T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-09T07:00:00.000Z'),
                },
                value: 33,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-09T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-16T07:00:00.000Z'),
                },
                value: 100,
              },
              {
                timeRange: {
                  startDate: utcToLocalTime('2023-01-16T07:00:00.000Z'),
                  endDate: utcToLocalTime('2023-01-23T07:00:00.000Z'),
                },
                value: 0,
              },
            ],
          },
        ],
        updatedAt: feedbackStatistic?.updatedAt, // the update time is not deterministic
      });
    });
  });

  async function setupPendingFeedbackStatistic(): Promise<void> {
    await getRepository(FeedbackStatisticConfiguration).save({
      id: 1,
      study: 'Teststudy',
      visibility: FeedbackStatisticVisibility.ALLAUDIENCES,
      title: 'Teststatistic',
      description: 'Testdescription',
      type: FeedbackStatisticType.RELATIVE_FREQUENCY_TIME_SERIES,
    });
    await getRepository(FeedbackStatistic).save({
      configurationId: 1,
      study: 'Teststudy',
      status: FeedbackStatisticStatus.PENDING,
      data: null,
    });
  }

  async function setupFeedbackStatisticConfiguration(): Promise<void> {
    await getRepository(FeedbackStatisticConfiguration).save({
      id: 2,
      study: 'Teststudy',
      visibility: FeedbackStatisticVisibility.ALLAUDIENCES,
      title: 'Teststatistic #2',
      description: 'Testdescription',
      type: FeedbackStatisticType.RELATIVE_FREQUENCY_TIME_SERIES,
    });
    await getRepository(RelativeFrequencyTimeSeriesConfiguration).save({
      id: 2,
      study: 'Teststudy',
      comparativeValues: {
        questionnaire: {
          id: 123,
          version: 1,
        },
        answerOptionValueCodes: {
          id: 456,
          variableName: 'some-variable-name',
          valueCodes: [0, 1, 2],
        },
      },
      timeSeries: [
        {
          id: 1,
          study: 'Teststudy',
          color: '#123456',
          label: 'yes',
          questionnaire: {
            id: 123,
            version: 1,
          },
          answerOptionValueCodes: {
            id: 456,
            variableName: 'some-variable-name',
            valueCodes: [1],
          },
        },
        {
          id: 2,
          study: 'Teststudy',
          color: '#123457',
          label: 'no',
          questionnaire: {
            id: 123,
            version: 1,
          },
          answerOptionValueCodes: {
            id: 456,
            variableName: 'some-variable-name',
            valueCodes: [0],
          },
        },
      ],
      intervalShift: {
        amount: -1,
        unit: TimeSpanUnit.WEEK,
      },
      timeRange: {
        startDate: utcToLocalTime('2022-12-01T00:00:00.000Z'),
        endDate: utcToLocalTime('2023-01-24T00:00:00.000Z'),
      },
    });
  }

  function createAnswersReadable(): ReadableStream {
    function* generate(): Generator<string> {
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123001,
        questionnaireInstanceDateOfIssue: '2023-01-02T07:00:00.000Z',
        answerOptionVariableName: 'some-variable-name',
        answerOptionId: 456,
        values: ['yes'],
      }) + os.EOL;
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123002,
        questionnaireInstanceDateOfIssue: '2023-01-09T07:00:00.000Z',
        answerOptionVariableName: 'some-variable-name',
        answerOptionId: 456,
        values: ['yes'],
      }) + os.EOL;
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123003,
        questionnaireInstanceDateOfIssue: '2023-01-09T07:00:00.000Z',
        answerOptionVariableName: 'some-variable-name',
        answerOptionId: 456,
        values: ['yes'],
      }) + os.EOL;
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123004,
        questionnaireInstanceDateOfIssue: '2023-01-09T07:00:00.000Z',
        answerOptionVariableName: 'some-variable-name',
        answerOptionId: 456,
        values: ['no'],
      }) + os.EOL;
      yield JSON.stringify({
        questionnaireId: 123,
        questionnaireInstanceId: 123004,
        questionnaireInstanceDateOfIssue: '2023-01-16T07:00:00.000Z',
        answerOptionVariableName: 'some-variable-name',
        answerOptionId: 456,
        values: ['no'],
      }) + os.EOL;
    }
    return Readable.from(generate());
  }

  function createQuestionnaire(): DeepPartial<QuestionnaireInternalDto> {
    return {
      id: 123,
      cycleAmount: 1,
      cycleUnit: 'week',
      activateAfterDays: 0,
      deactivateAfterDays: 100,
      notificationWeekday: 'monday',
      createdAt: new Date('2023-01-01'),
      questions: [
        {
          id: 987,
          isMandatory: true,
          position: 1,
          text: 'not relevant',
          answerOptions: [
            {
              id: 456,
              position: 1,
              variableName: 'some-variable-name',
              answerTypeId: AnswerType.SingleSelect,
              values: ['no', 'yes', 'maybe'],
              valuesCode: [0, 1, 2],
            },
          ],
        },
      ],
    };
  }
});

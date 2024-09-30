/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers, @typescript-eslint/no-non-null-assertion, security/detect-object-injection */

import { expect } from 'chai';

import { Server } from '../../src/server';
import { db } from '../../src/db';

import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  format,
  setDay,
  setHours,
  startOfDay,
  startOfToday,
  subDays,
} from 'date-fns';
import * as Mockdate from 'mockdate';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
} from '@pia/lib-messagequeue';

import {
  cleanup,
  setup,
} from './questionnaireInstanceCreation.spec.data/setup.helper';
import {
  dbWait,
  txWait,
  dbWaitWithReturn,
  setupPassthroughForInternalQuestionnaireServiceRequests,
  getInsertQuery,
  localTimeToUtc,
} from './helper';
import { config } from '../../src/config';
import { messageQueueService } from '../../src/services/messageQueueService';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceStatus,
} from '../../src/models/questionnaireInstance';
import { Questionnaire } from '../../src/models/questionnaire';
import { Question } from '../../src/models/question';
import { AnswerOption } from '../../src/models/answerOption';
import { Condition } from '../../src/models/condition';
import { Proband } from '../../src/models/proband';
import { createSandbox } from 'sinon';
import fetchMocker from 'fetch-mock';
import {
  CreateQuestionnaireInstanceInternalDto,
  HttpClient,
} from '@pia-system/lib-http-clients-internal';
import { Answer } from '../../src/models/answer';

type PartialWithRequiredId<T extends { id: number }> = Partial<Omit<T, 'id'>> &
  Pick<T, 'id'>;

interface QuestionnaireWithQuestions {
  questionnaire: PartialWithRequiredId<Questionnaire>;
  question: PartialWithRequiredId<Question>;
  answerOptions: PartialWithRequiredId<AnswerOption>[];
}

type CreateQuestionnaireInstanceInternalDtoJsonResponse = Omit<
  CreateQuestionnaireInstanceInternalDto,
  'dateOfIssue'
> & {
  dateOfIssue: string;
};

describe('Questionnaire instance creation', function () {
  const fetchMock = fetchMocker.sandbox();
  const testSandbox = createSandbox();

  const CREATED_BEFORE_500_DAYS = -500;
  const defaultNotificationTimeHour = config.notificationTime.hours;
  const mqc = new MessageQueueClient({
    ...config.servers.messageQueue,
    serviceName: 'test',
  });

  const externalConditionId = 777;
  const dailyQuestionnaireForProbands = createQuestionnaire({
    cycle_amount: 2,
    cycle_unit: 'day',
    activate_after_days: 5,
    deactivate_after_days: 20,
    type: 'for_probands',
    sort_order: 7,
  });
  const dailyQuestionnaireQuestion = {
    id: 99999,
    questionnaire_id: 99999,
    questionnaire_version: 1,
    text: 'Beispielfrage',
    position: 1,
    is_mandatory: false,
  };
  const dailyQuestionnaireAnswerOption = {
    id: 99999,
    question_id: 99999,
    text: 'Beispielunterfrage',
    answer_type_id: 1,
    values: [{ value: 'Ja' }, { value: 'Nein' }],
    position: 1,
  };

  before(async () => {
    await Server.init();
    await mqc.connect(true);
  });

  after(async () => {
    await Server.stop();
    await mqc.disconnect();
  });

  beforeEach(async () => {
    // We set the current time, after the notification time, so questionnaires
    // will be activated for each test case. If your tests fail because of this,
    // you must mock the time according to your specific test case.
    Mockdate.set(addHours(startOfToday(), defaultNotificationTimeHour + 1));

    fetchMock.catch({
      status: 200,
      body: JSON.stringify({}),
    });

    setupPassthroughForInternalQuestionnaireServiceRequests(fetchMock);

    await setup();

    testSandbox
      .stub<typeof HttpClient, 'fetch'>(HttpClient, 'fetch')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake(fetchMock);
  });

  afterEach(async () => {
    await cleanup();
    testSandbox.restore();
    fetchMock.restore();
    Mockdate.reset();
  });

  describe('Autocreate/delete questionnaire instances on proband creation / deletion', () => {
    it('should create questionnaire instances for research_team on proband.created message', async () => {
      // Arrange
      const pseudonym = 'qtest-proband1';
      const studyName = 'ApiTestStudie';
      const dateOfQuestionnaireCreation = subDays(new Date(), 100);

      await deleteParticipant(pseudonym);
      const questionnaire = await insertQuestionnaire({
        type: 'for_research_team',
        created_at: dateOfQuestionnaireCreation,
        sort_order: 3,
      });

      // previous calls due to other test data should not be considered
      fetchMock.resetHistory();

      // Act
      await insertParticipant({
        pseudonym,
        status: 'active',
        study: studyName,
        first_logged_in_at: null,
      });
      await sendProbandCreatedMessage(pseudonym, studyName);

      // Assert
      const expectedPayload: CreateQuestionnaireInstanceInternalDto = {
        questionnaireId: questionnaire.id,
        questionnaireVersion: questionnaire.version,
        questionnaireName: questionnaire.name,
        dateOfIssue: localTimeToUtc(
          addHours(
            startOfDay(dateOfQuestionnaireCreation),
            defaultNotificationTimeHour
          )
        ),
        studyId: questionnaire.study_id,
        pseudonym,
        sortOrder: questionnaire.sort_order,
        cycle: 1,
        status: 'active',
        origin: null,
      };

      expect(fetchMock.called()).to.be.true;
      expect(
        fetchMock.called('path:/questionnaire/questionnaireInstances', {
          method: 'POST',
          body: [JSON.parse(JSON.stringify(expectedPayload))],
        })
      ).to.be.true;
    });

    it('should delete questionnaire instances on proband deleted message', async () => {
      // Arrange
      const pseudonym = 'qtest-proband1';
      await db.none('DELETE FROM probands WHERE pseudonym=$(pseudonym)', {
        pseudonym: pseudonym,
      });

      const questionnaire = await insertQuestionnaire({
        type: 'for_research_team',
      });
      await insertParticipant({
        pseudonym: pseudonym,
        status: 'active',
        study: 'ApiTestStudie',
        first_logged_in_at: null,
      });
      await insertParticipant({
        pseudonym: 'anyone',
        status: 'active',
        study: 'ApiTestStudie',
        first_logged_in_at: null,
      });

      // questionnaire for participant which should be deleted later
      await insertQuestionnaireInstance({ user_id: pseudonym }, questionnaire);

      // questionnaire instance for another participant which should not be deleted
      await insertQuestionnaireInstance({ user_id: 'anyone' }, questionnaire);

      // Act
      const processedProbandDeleted =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          MessageQueueTopic.PROBAND_DELETED
        );

      const probandDeleted = await mqc.createProducer(
        MessageQueueTopic.PROBAND_DELETED
      );
      await probandDeleted.publish({
        pseudonym,
        studyName: 'ApiTestStudie',
        deletionType: 'full',
      });
      await processedProbandDeleted;

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE 1 = 1',
        { qId: questionnaire.id }
      );

      expect(addedQI.length).to.equal(1);
      expect(addedQI.find((qi) => qi.user_id === pseudonym)).to.be.undefined;
    });
  });

  describe('Autocreate/delete questionnaire instances on questionnaire insert and update and on user update', () => {
    const dateQuestionnaire = createQuestionnaire({
      cycle_unit: 'date',
      type: 'for_probands',
    });

    it('should not create any instances when no user is active in study and questionnaire is added', async function () {
      await insertQuestionnaire(dailyQuestionnaireForProbands);
      expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not create any instances when user is active in study but no questionnaire was added', async function () {
      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          pseudonym: 'qtest-proband1',
        }
      );

      expect(fetchMock.calls().length).to.equal(0);
    });

    it('should not delete or create any instances when questionnaire was deactivated', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCount = 11;
      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          pseudonym: 'qtest-proband1',
        }
      );

      await insertQuestionnaire(dailyQuestionnaireForProbands);
      await insertAllQuestionnaireInstancesFromInternalApiCalls();

      // Act
      await dbWait('UPDATE questionnaires SET active=false WHERE id=${qId}', {
        qId: 99999,
      });
      const qis = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      // Assert
      expect(
        getFetchMockCallsPayloads('path:/questionnaire/questionnaireInstances')
      ).to.have.length(expectedQuestionnaireInstanceCount);
      expect(qis.length).to.equal(expectedQuestionnaireInstanceCount);
    });

    context('dated questionnaires', () => {
      it('should create correct questionnaire instances when adding a questionnaire with set date without the user having been logged in before', async function () {
        // Arrange / Act
        await insertQuestionnaire(dateQuestionnaire);

        // Assert
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);
        expect(
          new Date(addedQI[0]!.dateOfIssue).getTime() -
            localTimeToUtc(
              addHours(startOfToday(), defaultNotificationTimeHour)
            ).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });

      it('should create correct questionnaire instance on correct notification day when adding a questionnaire with set date', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          cycle_unit: 'date',
          notification_weekday: 'wednesday',
        });

        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);
        expect(new Date(addedQI[0]!.dateOfIssue).toISOString()).to.equal(
          localTimeToUtc(
            addHours(startOfToday(), defaultNotificationTimeHour)
          ).toISOString()
        );

        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });
    });

    context('one time questionnaires', () => {
      it('should create correct one time questionnaire instances when adding a questionnaire', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 4),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          cycle_unit: 'once',
        });

        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);
        expect(
          new Date(addedQI[0]!.dateOfIssue).getTime() -
            localTimeToUtc(
              subDays(addHours(startOfToday(), defaultNotificationTimeHour), 4)
            ).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });

      it('should create correct one time questionnaire instance and ignore notification day when adding a questionnaire', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          no_questions: 2,
          notification_weekday: 'wednesday',
        });

        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);

        const dateNo = subDays(new Date(), 5).getDay();
        expect(new Date(addedQI[0]!.dateOfIssue).getDay()).to.equal(dateNo);

        expect(
          new Date(addedQI[0]!.dateOfIssue).getTime() -
            localTimeToUtc(
              subDays(addHours(startOfToday(), defaultNotificationTimeHour), 5)
            ).getTime()
        ).to.equal(0);

        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });
    });

    context('on-demand questionnaires', () => {
      it('should create one instance for spontan fb when adding the questionnaire and disregard pseudonym notification settings', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 10),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          cycle_unit: 'spontan',
          notification_tries: 0,
          notification_title: '',
          notification_body_new: '',
          notification_body_in_progress: '',
          notification_weekday: null,
        });
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);
        expect(
          new Date(addedQI[0]!.dateOfIssue).getTime() -
            localTimeToUtc(addDays(startOfToday(), -10)).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });

      it('should create one instance for spontan fb when adding the questionnaire with unused other fields and disregard pseudonym notification settings', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 10),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          cycle_amount: 2,
          cycle_unit: 'spontan',
          activate_after_days: 5,
          deactivate_after_days: 365,
          notification_weekday: 'sunday',
          notification_interval: 1,
          notification_interval_unit: 'days',
        });
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(1);
        expect(
          new Date(addedQI[0]!.dateOfIssue).getTime() -
            localTimeToUtc(addDays(startOfToday(), -5)).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });

      it('should delete all old instances and add one new one when updating a daily questionnaire to spontan', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire(dailyQuestionnaireForProbands);

        const addedQI = getFetchMockCallPayload<
          CreateQuestionnaireInstanceInternalDto[]
        >('path:/questionnaire/questionnaireInstances');

        expect(addedQI.length).to.equal(11);

        for (const qi of addedQI) {
          await insertQuestionnaireInstance(
            {
              user_id: qi.pseudonym,
              cycle: qi.cycle,
              date_of_issue: qi.dateOfIssue,
            },
            dailyQuestionnaireForProbands as Questionnaire
          );
        }

        await dbWait(
          'UPDATE questionnaires SET cycle_unit=${cycle_unit} WHERE id=${qId}',
          {
            cycle_unit: 'spontan',
            qId: 99999,
          }
        );

        const qiDB = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(qiDB.length).to.equal(0);

        expect(
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          ).length
        ).to.equal(12); // 11 old ones + 1 new one
      });
    });

    context('recurring questionnaires', () => {
      it('should update questionnaire instances when updating the cycle amount of a questionnaire', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );

        await insertQuestionnaire(dailyQuestionnaireForProbands);
        const addedQIbefore = getFetchMockCallPayload<
          CreateQuestionnaireInstanceInternalDto[]
        >('path:/questionnaire/questionnaireInstances');
        expect(addedQIbefore.length).to.equal(11);

        for (const qi of addedQIbefore) {
          await insertQuestionnaireInstance(
            {
              user_id: qi.pseudonym,
              cycle: qi.cycle,
              date_of_issue: qi.dateOfIssue,
            },
            dailyQuestionnaireForProbands as Questionnaire
          );
        }

        await dbWait(
          'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
          {
            cycle_amount: 4,
            qId: 99999,
          }
        );

        // Previously added instances should have been removed
        const addedQiDb: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQiDb.length).to.equal(0);

        // Requests for new instances should have been made
        const addedQiAfter = getFetchMockCallPayload<
          CreateQuestionnaireInstanceInternalDto[]
        >('path:/questionnaire/questionnaireInstances');
        expect(addedQiAfter.length).to.equal(6);

        expect(
          new Date(addedQiAfter[0]!.dateOfIssue).getTime() -
            localTimeToUtc(
              addHours(startOfToday(), defaultNotificationTimeHour)
            ).getTime()
        ).to.equal(0);
        expect(
          new Date(addedQiAfter[1]!.dateOfIssue).getTime() -
            localTimeToUtc(
              addDays(addHours(startOfToday(), defaultNotificationTimeHour), 4)
            ).getTime()
        ).to.equal(0);
        expect(
          new Date(addedQiAfter[5]!.dateOfIssue).getTime() -
            localTimeToUtc(
              addDays(addHours(startOfToday(), defaultNotificationTimeHour), 20)
            ).getTime()
        ).to.equal(0);

        expect(addedQiAfter[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQiAfter[1]?.studyId).to.equal('ApiTestStudie');
        expect(addedQiAfter[5]?.studyId).to.equal('ApiTestStudie');

        expect(addedQiAfter[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQiAfter[1]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQiAfter[5]?.pseudonym).to.equal('qtest-proband1');

        expect(addedQiAfter[0]?.sortOrder).to.equal(7);
        expect(addedQiAfter[1]?.sortOrder).to.equal(7);
        expect(addedQiAfter[5]?.sortOrder).to.equal(7);
      });

      context('hourly', () => {
        it('should create correct hourly questionnaire instances when adding a questionnaire with 12h cycle and disregard pseudonym notification settings', async function () {
          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire({
            cycle_amount: 12,
            cycle_unit: 'hour',
            cycle_per_day: 3,
            cycle_first_hour: 3,
            activate_after_days: 5,
            deactivate_after_days: 10,
          });
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(22);

          for (let i = 0; i < addedQI.length; i++) {
            expect(addedQI[i]?.studyId).to.equal('ApiTestStudie');
            expect(addedQI[i]?.pseudonym).to.equal('qtest-proband1');
            expect(addedQI[i]?.dateOfIssue).to.equal(
              localTimeToUtc(
                setHours(
                  addDays(startOfToday(), (i - (i % 2)) / 2),
                  3 + (i % 2) * 12
                )
              ).toISOString()
            );
          }
        });

        it('should create correct hourly questionnaire instances when adding a questionnaire with 5h cycle and disregard pseudonym notification settings', async function () {
          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire({
            cycle_amount: 5,
            cycle_unit: 'hour',
            cycle_per_day: 3,
            cycle_first_hour: 3,
            activate_after_days: 5,
            deactivate_after_days: 10,
          });
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(33);

          expect(
            new Date(addedQI[0]!.dateOfIssue).getTime() -
              localTimeToUtc(addHours(startOfToday(), 3)).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[1]!.dateOfIssue).getTime() -
              localTimeToUtc(addHours(startOfToday(), 3 + 5)).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[5]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 1), 3 + 2 * 5)
              ).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[32]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 10), 3 + 2 * 5)
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[1]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[32]?.studyId).to.equal('ApiTestStudie');

          expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[1]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[32]?.pseudonym).to.equal('qtest-proband1');

          expect(addedQI[0]?.cycle).to.equal(1);
          expect(addedQI[1]?.cycle).to.equal(2);
          expect(addedQI[32]?.cycle).to.equal(33);
        });

        it('should create correct hourly questionnaire instances when adding a questionnaire with 1h cycle and disregard pseudonym notification settings', async function () {
          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire({
            cycle_amount: 1,
            cycle_unit: 'hour',
            cycle_per_day: 3,
            cycle_first_hour: 3,
            activate_after_days: 5,
            deactivate_after_days: 10,
          });
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(33);

          expect(
            new Date(addedQI[0]!.dateOfIssue).getTime() -
              localTimeToUtc(addHours(startOfToday(), 3)).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[1]!.dateOfIssue).getTime() -
              localTimeToUtc(addHours(startOfToday(), 3 + 1)).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[5]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 1), 3 + 2)
              ).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[32]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 10), 3 + 2)
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[1]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[32]?.studyId).to.equal('ApiTestStudie');

          expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[1]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[32]?.pseudonym).to.equal('qtest-proband1');

          expect(addedQI[0]?.cycle).to.equal(1);
          expect(addedQI[1]?.cycle).to.equal(2);
          expect(addedQI[32]?.cycle).to.equal(33);
        });
      });

      context('daily', () => {
        it('should create correct daily occuring questionnaire instances when adding a questionnaire', async function () {
          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire(dailyQuestionnaireForProbands);
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(11);
          expect(
            new Date(addedQI[0]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(startOfToday(), defaultNotificationTimeHour)
              ).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[1]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addDays(
                  addHours(startOfToday(), defaultNotificationTimeHour),
                  2
                )
              ).getTime()
          ).to.equal(0);
          expect(
            new Date(addedQI[10]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addDays(
                  addHours(startOfToday(), defaultNotificationTimeHour),
                  20
                )
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[1]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[10]?.studyId).to.equal('ApiTestStudie');

          expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[1]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[10]?.pseudonym).to.equal('qtest-proband1');

          expect(addedQI[0]?.cycle).to.equal(1);
          expect(addedQI[1]?.cycle).to.equal(2);
          expect(addedQI[10]?.cycle).to.equal(11);

          expect(addedQI[0]?.sortOrder).to.equal(7);
          expect(addedQI[1]?.sortOrder).to.equal(7);
          expect(addedQI[10]?.sortOrder).to.equal(7);
        });
      });

      context('weekly', () => {
        it('should create correct weekly questionnaire instances when user becomes active in study', async function () {
          // Arrange
          const pseudonym = 'qtest-proband1';
          const firstExpectedIssueDate = addDays(
            addHours(startOfToday(), defaultNotificationTimeHour),
            5
          );
          await insertQuestionnaire({
            cycle_amount: 2,
            cycle_unit: 'week',
            activate_after_days: 5,
            deactivate_after_days: 100,
            sort_order: 2,
          });

          // Act
          const processedProbandCreated =
            MessageQueueTestUtils.injectMessageProcessedAwaiter(
              messageQueueService,
              MessageQueueTopic.PROBAND_LOGGED_IN
            );

          const probandCreated = await mqc.createProducer(
            MessageQueueTopic.PROBAND_LOGGED_IN
          );
          await probandCreated.publish({
            pseudonym,
            studyName: 'ApiTestStdie',
          });

          await processedProbandCreated;

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(8);
          addedQI.forEach((qi, i) => {
            expect(qi.studyId).to.equal('ApiTestStudie');
            expect(qi.pseudonym).to.equal('qtest-proband1');
            expect(qi.sortOrder).to.equal(2);
            expect(
              new Date(qi.dateOfIssue).getTime() -
                localTimeToUtc(
                  addWeeks(firstExpectedIssueDate, i * 2)
                ).getTime()
            ).to.equal(0);
          });
        });

        it('should create correct weekly questionnaire instances on correct week day when user becomes active in study', async function () {
          // Arrange
          const pseudonym = 'qtest-proband1';
          await insertQuestionnaire({
            cycle_amount: 2,
            cycle_unit: 'week',
            activate_after_days: 5,
            deactivate_after_days: 100,
            notification_weekday: 'monday',
          });

          // Act
          const processedProbandCreated =
            MessageQueueTestUtils.injectMessageProcessedAwaiter(
              messageQueueService,
              MessageQueueTopic.PROBAND_LOGGED_IN
            );

          const probandCreated = await mqc.createProducer(
            MessageQueueTopic.PROBAND_LOGGED_IN
          );
          await probandCreated.publish({
            pseudonym,
            studyName: 'ApiTestStudie',
          });

          await processedProbandCreated;

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(8);

          const dateNo = 1;

          for (let i = 0; i < addedQI.length; i++) {
            const expectedWeek = addWeeks(
              addDays(setHours(startOfToday(), defaultNotificationTimeHour), 5),
              i * 2
            );
            const expectedDate = localTimeToUtc(
              nextDayXOfWeek(expectedWeek, dateNo)
            ).toISOString();

            expect(new Date(addedQI[i]!.dateOfIssue).getDay()).to.equal(dateNo);
            expect(addedQI[i]?.studyId).to.equal('ApiTestStudie');
            expect(addedQI[i]?.pseudonym).to.equal('qtest-proband1');
            expect(new Date(addedQI[i]!.dateOfIssue).toISOString()).to.equal(
              expectedDate
            );
          }

          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 5)).to.be
            .true;
        });
      });

      context('monthly', () => {
        it('should create correct monthly questionnaire instances', async function () {
          // Arrange
          const pseudonym = 'qtest-proband1';
          await insertQuestionnaire({
            cycle_amount: 2,
            cycle_unit: 'month',
            activate_after_days: 5,
            deactivate_after_days: 365,
            created_at: addDays(startOfToday(), CREATED_BEFORE_500_DAYS),
          });

          // Act
          const processedProbandCreated =
            MessageQueueTestUtils.injectMessageProcessedAwaiter(
              messageQueueService,
              MessageQueueTopic.PROBAND_LOGGED_IN
            );

          const probandCreated = await mqc.createProducer(
            MessageQueueTopic.PROBAND_LOGGED_IN
          );
          await probandCreated.publish({
            pseudonym,
            studyName: 'ApiTestStudie',
          });

          await processedProbandCreated;

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(7);
          for (let i = 0; i < addedQI.length; i++) {
            expect(addedQI[i]?.studyId).to.equal('ApiTestStudie');
            expect(addedQI[i]?.pseudonym).to.equal('qtest-proband1');
            expect(new Date(addedQI[i]!.dateOfIssue).toISOString()).to.equal(
              localTimeToUtc(
                addMonths(
                  addDays(
                    setHours(startOfToday(), defaultNotificationTimeHour),
                    5
                  ),
                  i * 2
                )
              ).toISOString()
            );
          }

          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 5)).to.be
            .true;
        });

        it('should create correct monthly questionnaire instances on correct week days', async function () {
          // Arrange
          const pseudonym = 'qtest-proband1';
          await insertQuestionnaire({
            cycle_amount: 2,
            cycle_unit: 'month',
            activate_after_days: 5,
            deactivate_after_days: 365,
            notification_weekday: 'sunday',
            created_at: addDays(startOfToday(), CREATED_BEFORE_500_DAYS),
          });

          // Act
          const processedProbandCreated =
            MessageQueueTestUtils.injectMessageProcessedAwaiter(
              messageQueueService,
              MessageQueueTopic.PROBAND_LOGGED_IN
            );

          const probandCreated = await mqc.createProducer(
            MessageQueueTopic.PROBAND_LOGGED_IN
          );
          await probandCreated.publish({
            pseudonym,
            studyName: 'ApiTestStudie',
          });

          await processedProbandCreated;

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(7);

          const dateNo = 0;

          for (let i = 0; i < addedQI.length; i++) {
            expect(new Date(addedQI[i]!.dateOfIssue).getDay()).to.equal(dateNo);
            expect(addedQI[i]?.studyId).to.equal('ApiTestStudie');
            expect(addedQI[i]?.pseudonym).to.equal('qtest-proband1');
            expect(new Date(addedQI[i]!.dateOfIssue).toISOString()).to.equal(
              localTimeToUtc(
                nextDayXOfWeek(
                  addMonths(
                    addDays(
                      setHours(startOfToday(), defaultNotificationTimeHour),
                      5
                    ),
                    i * 2
                  ),
                  dateNo
                )
              ).toISOString()
            );
          }
          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 5)).to.be
            .true;
        });

        it('should create correct monthly questionnaire and set the date_of_issue starting from current date and not from first_logged_in_at', async function () {
          // Arrange
          const pseudonym = 'qtest-proband1';
          const monthQuestionnaire2: Partial<Questionnaire> = {
            cycle_amount: 2,
            cycle_unit: 'month',
            activate_after_days: 5,
            deactivate_after_days: 365,
            created_at: startOfToday(),
          };
          await insertQuestionnaire(monthQuestionnaire2);

          // Act
          const processedProbandCreated =
            MessageQueueTestUtils.injectMessageProcessedAwaiter(
              messageQueueService,
              MessageQueueTopic.PROBAND_LOGGED_IN
            );

          const probandCreated = await mqc.createProducer(
            MessageQueueTopic.PROBAND_LOGGED_IN
          );
          await probandCreated.publish({
            pseudonym,
            studyName: 'ApiTestStudie',
          });

          await processedProbandCreated;

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(7);
          const startDate = addDays(
            setHours(startOfToday(), defaultNotificationTimeHour),
            monthQuestionnaire2.activate_after_days!
          );
          for (let i = 0; i < addedQI.length; i++) {
            const expectedDate = addMonths(
              setHours(startOfDay(startDate), defaultNotificationTimeHour),
              2 * i
            );
            expect(addedQI[i]?.studyId).to.equal('ApiTestStudie');
            expect(addedQI[i]?.pseudonym).to.equal('qtest-proband1');
            expect(new Date(addedQI[i]!.dateOfIssue).toISOString()).to.equal(
              localTimeToUtc(expectedDate).toISOString()
            );
          }
          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 5)).to.be
            .true;
        });
      });
    });

    context('compliance', () => {
      it('should create instances when adding a questionnaire that needs compliance and user has complied', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date), compliance_samples=true WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );

        await insertQuestionnaire({
          ...dateQuestionnaire,
          compliance_needed: true,
        });
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        const dateOfIssue = new Date(addedQI[0]!.dateOfIssue);
        const expectedDateOfIssue = localTimeToUtc(
          addHours(startOfToday(), defaultNotificationTimeHour)
        );

        expect(addedQI.length).to.equal(1);
        expect(dateOfIssue.getTime() - expectedDateOfIssue.getTime()).to.equal(
          0,
          `date_of_issue is ${dateOfIssue.toISOString()} but should be ${expectedDateOfIssue.toISOString()}`
        );
        expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
        expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);
      });

      it('should delete questionnaire instances when updating the questionnaire to need compliance', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date), compliance_samples=false WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire(dailyQuestionnaireForProbands);

        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQI.length).to.equal(11);

        for (const qi of addedQI) {
          await insertQuestionnaireInstance(
            {
              user_id: qi.pseudonym,
              cycle: qi.cycle,
              date_of_issue: qi.dateOfIssue,
            },
            dailyQuestionnaireForProbands as Questionnaire
          );
        }

        await dbWait(
          'UPDATE questionnaires SET compliance_needed=true WHERE id=${qId}',
          { qId: 99999 }
        );
        const addedQiDb = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQiDb.length).to.equal(0);
      });

      it('should create questionnaire instances when updating the questionnaire to not need compliance', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date), compliance_samples=false WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );

        await insertQuestionnaire({
          ...dailyQuestionnaireForProbands,
          compliance_needed: true,
        });

        const addedQiBefore =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQiBefore.length).to.equal(0);

        await dbWait(
          'UPDATE questionnaires SET compliance_needed=false WHERE id=${qId}',
          { qId: 99999 }
        );

        const addedQiAfter =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQiAfter.length).to.equal(11);
      });

      it('should not create any instances when adding a questionnaire that needs compliance and user has not complied', async function () {
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date), compliance_samples=false WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );

        await insertQuestionnaire({
          ...dateQuestionnaire,
          compliance_needed: true,
        });

        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        expect(addedQI.length).to.equal(0);
      });
    });

    context('deactivated probands', () => {
      it('should create instances for deactivated probands when adding a questionnaire of type "for_research_team"', async () => {
        await db.none(
          "UPDATE probands SET first_logged_in_at=$(date), status='deactivated' WHERE pseudonym=$(pseudonym)",
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire({
          ...dailyQuestionnaireForProbands,
          type: 'for_research_team',
        });
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQI.length).to.equal(22);
      });

      it('should not create any instances for deactivated probands when adding a questionnaire of type "for_proband"', async () => {
        await db.none(
          "UPDATE probands SET first_logged_in_at=$(date), status='deactivated' WHERE pseudonym=$(pseudonym)",
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire(dailyQuestionnaireForProbands);
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQI.length).to.equal(0);
      });

      it('should not create any instances for probands when they become deactivated', async function () {
        await insertQuestionnaire(dailyQuestionnaireForProbands);
        await db.none(
          "UPDATE probands SET first_logged_in_at=$(date), status='deactivated' WHERE pseudonym=$(pseudonym)",
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        const addedQI =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );
        expect(addedQI.length).to.equal(0);
      });
    });

    context('questionnaires with conditions', () => {
      it('should delete questionnaire instances and create 1 new one when updating a questionnaire and changing the condition type from "external" to "internal_last"', async function () {
        const externalQuestionnaire: Partial<Questionnaire> = {
          id: 88888,
          study_id: 'ApiTestStudie',
          name: 'TestExternalQuestionnaire',
          no_questions: 2,
          cycle_amount: 2,
          cycle_unit: 'day',
          activate_after_days: 5,
          deactivate_after_days: 20,
          notification_tries: 3,
          notification_title: 'title',
          notification_body_new: 'new',
          notification_body_in_progress: 'old',
          created_at: addDays(startOfToday(), -100),
        };

        const externalQuestion = {
          id: 88888,
          questionnaire_id: 88888,
          text: 'Beispielfrage',
          position: 1,
          is_mandatory: false,
        };

        const externalAnswerOption = {
          id: 88888,
          question_id: 88888,
          text: 'Beispielunterfrage',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          position: 1,
        };

        const condition = {
          condition_type: 'external',
          condition_questionnaire_id: dailyQuestionnaireForProbands.id,
          condition_operand: '==',
          condition_value: 'Ja',
          condition_target_questionnaire: externalQuestionnaire.id,
          condition_target_answer_option: externalAnswerOption.id,
        };

        const condition_internal = {
          condition_type: 'internal_last',
          condition_questionnaire_id: dailyQuestionnaireForProbands.id,
          condition_operand: '==',
          condition_value: 'Ja',
          condition_target_questionnaire: dailyQuestionnaireForProbands.id,
          condition_target_answer_option: dailyQuestionnaireAnswerOption.id,
        };

        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );
        await insertQuestionnaire(externalQuestionnaire);

        const addedInitialQIs =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          );

        for (const qi of addedInitialQIs) {
          await insertQuestionnaireInstance(
            {
              user_id: qi.pseudonym,
              cycle: qi.cycle,
              date_of_issue: qi.dateOfIssue,
            },
            {
              ...(externalQuestionnaire as Questionnaire),
              version: 1,
            }
          );
        }

        await db.none(
          'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          externalQuestion
        );
        await db.none(
          'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          externalAnswerOption
        );

        const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 88888 }
        );
        await dbWait(
          'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          {
            status: 'released_once',
            date: new Date(),
            id: addedExternalQI[0]!.id,
          }
        );

        const externalAnswer = {
          questionnaire_instance_id: addedExternalQI[0]!.id,
          question_id: 88888,
          answer_option_id: 88888,
          value: 'Ja',
        };

        await db.none(
          'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          externalAnswer
        );

        await txWait([
          {
            query: getQuestionnaireInsertQuery(
              dailyQuestionnaireForProbands,
              false
            ),
            arg: dailyQuestionnaireForProbands,
          },
          {
            query:
              'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
            arg: dailyQuestionnaireQuestion,
          },
          {
            query:
              'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
            arg: dailyQuestionnaireAnswerOption,
          },
          {
            query:
              'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
            arg: condition,
          },
        ]);

        const addedDailyQIs =
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          ).filter((qi) => qi.questionnaireId === 99999);

        expect(addedDailyQIs.length).to.equal(11);

        for (const qi of addedDailyQIs) {
          await insertQuestionnaireInstance(
            {
              user_id: qi.pseudonym,
              cycle: qi.cycle,
              date_of_issue: qi.dateOfIssue,
            },
            dailyQuestionnaireForProbands as Questionnaire
          );
        }

        await txWait([
          {
            query:
              'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
            arg: {
              cycle_amount: 4,
              qId: 99999,
            },
          },
          {
            query:
              'DELETE FROM conditions WHERE condition_questionnaire_id=99999',
          },
          {
            query:
              'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
            arg: condition_internal,
          },
        ]);

        const addedQiDb = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQiDb.length).to.equal(0);

        expect(
          getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
            'path:/questionnaire/questionnaireInstances'
          ).filter((qi) => qi.questionnaireId === 99999).length
        ).to.equal(12); // 11 from the previous insert and 1 new one
      });

      context('condition_type=internal_last', () => {
        it('should only create 1 questionnaire instance when adding a questionnaire', async function () {
          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          const condition = {
            condition_type: 'internal_last',
            condition_questionnaire_id: dailyQuestionnaireForProbands.id,
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: dailyQuestionnaireForProbands.id,
            condition_target_answer_option: dailyQuestionnaireAnswerOption.id,
          };

          await txWait([
            {
              query: getQuestionnaireInsertQuery(
                dailyQuestionnaireForProbands,
                false
              ),
              arg: dailyQuestionnaireForProbands,
            },
            {
              query:
                'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
              arg: dailyQuestionnaireQuestion,
            },
            {
              query:
                'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
              arg: dailyQuestionnaireAnswerOption,
            },
            {
              query:
                'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
              arg: condition,
            },
          ]);

          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(1);
          expect(
            new Date(addedQI[0]!.dateOfIssue).getTime() -
              localTimeToUtc(
                addHours(startOfToday(), defaultNotificationTimeHour)
              ).getTime()
          ).to.equal(0);
          expect(addedQI[0]?.studyId).to.equal('ApiTestStudie');
          expect(addedQI[0]?.pseudonym).to.equal('qtest-proband1');
          expect(addedQI[0]?.sortOrder).to.equal(7);
        });

        it('should create questionnaire instances when updating a questionnaire and deleting the internal condition', async function () {
          const condition = {
            condition_type: 'internal_last',
            condition_questionnaire_id: dailyQuestionnaireForProbands.id,
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: dailyQuestionnaireForProbands.id,
            condition_target_answer_option: dailyQuestionnaireAnswerOption.id,
          };

          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );

          await txWait([
            {
              query: getQuestionnaireInsertQuery(
                dailyQuestionnaireForProbands,
                false
              ),
              arg: dailyQuestionnaireForProbands,
            },
            {
              query:
                'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
              arg: dailyQuestionnaireQuestion,
            },
            {
              query:
                'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
              arg: dailyQuestionnaireAnswerOption,
            },
            {
              query:
                'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
              arg: condition,
            },
          ]);

          let addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );
          expect(addedQI.length).to.equal(1);

          await txWait([
            {
              query:
                'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
              arg: {
                cycle_amount: 4,
                qId: 99999,
              },
            },
            {
              query:
                'DELETE FROM conditions WHERE condition_questionnaire_id=99999',
            },
          ]);

          addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(7); // 1 from the previous insert and 6 new ones
          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 7)).to.be
            .true;
        });
      });

      context('condition_type=external', () => {
        it('should create questionnaire instances when adding a questionnaire with external condition that is met', async function () {
          // Arrange
          await setupExternalConditionTestCase();

          const addedExternalQI =
            await insertAllQuestionnaireInstancesFromInternalApiCalls();

          expect(addedExternalQI).to.have.length(11);

          fetchMock.resetHistory();

          // Act
          await insertAnswerAndReleaseQuestionnaireInstance(
            {
              question_id: 88888,
              answer_option_id: 88888,
              value: 'Ja',
            },
            addedExternalQI[0]!
          );

          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          // Assert
          expect(addedQI.length).to.equal(11);
          expect(addedQI.map((qi) => qi.sortOrder).every((v) => v === 7)).to.be
            .true;
        });

        it('should create questionnaire instances when updating a questionnaire and deleting the condition that was not met', async function () {
          // Arrange
          await setupExternalConditionTestCase();

          const addedExternalQI =
            await insertAllQuestionnaireInstancesFromInternalApiCalls();

          expect(addedExternalQI).to.have.length(11);

          fetchMock.resetHistory();

          // Act 1 - add answer that does not meet the condition
          await insertAnswerAndReleaseQuestionnaireInstance(
            {
              question_id: 88888,
              answer_option_id: 88888,
              value: 'Nein',
            },
            addedExternalQI[0]!
          );

          expect(fetchMock.called('path:/questionnaire/questionnaireInstances'))
            .to.be.false;

          // Act 2 - update questionnaire and delete condition
          await txWait([
            {
              query:
                'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
              arg: {
                cycle_amount: 4,
                qId: 99999,
              },
            },
            {
              query:
                'DELETE FROM conditions WHERE condition_questionnaire_id=99999',
            },
          ]);

          // Assert
          const addedQI =
            getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
              'path:/questionnaire/questionnaireInstances'
            );

          expect(addedQI.length).to.equal(6);
        });

        it('should delete questionnaire instances when updating a questionnaire and adding a condition that is not met', async function () {
          // Arrange - setup test for external condition, but do not create the condition immediately
          const { externalQuestionnaire, conditionalQuestionnaire } =
            await setupExternalConditionTestCase({ condition: null });

          const initiallyAddedQI =
            await insertAllQuestionnaireInstancesFromInternalApiCalls();

          const addedExternalQI = initiallyAddedQI.filter(
            (qi) => qi.questionnaire_id === 88888
          );
          const addedConditionalQI = initiallyAddedQI.filter(
            (qi) => qi.questionnaire_id === 99999
          );

          expect(addedExternalQI).to.have.length(11);
          expect(addedConditionalQI).to.have.length(11);

          fetchMock.resetHistory();

          // Act 1 - add answer that does not meet the condition
          await insertAnswerAndReleaseQuestionnaireInstance(
            {
              question_id: 88888,
              answer_option_id: 88888,
              value: 'Nein',
            },
            addedExternalQI[0]!
          );

          // Act 2 - update questionnaire and add a condition that is not met
          await txWait([
            {
              query:
                'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
              arg: {
                cycle_amount: 4,
                qId: 99999,
              },
            },
            {
              query:
                'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
              arg: {
                condition_type: 'external',
                condition_questionnaire_id: conditionalQuestionnaire.id,
                condition_questionnaire_version: 1,
                condition_operand: '==',
                condition_value: 'Ja',
                condition_target_questionnaire: externalQuestionnaire.id,
                condition_target_questionnaire_version: 1,
                condition_target_answer_option: 88888,
              },
            },
          ]);

          const currentQI = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(currentQI.length).to.equal(0);
          expect(
            fetchMock.calls('path:/questionnaire/questionnaireInstances')
          ).to.have.length(0);
        });

        it('should not create questionnaire instances when updating a questionnaire and keeping the condition that was not met', async function () {
          // Arrange - setup test for external condition, but do not create the condition immediately
          await setupExternalConditionTestCase();

          const addedExternalQI =
            await insertAllQuestionnaireInstancesFromInternalApiCalls();

          expect(addedExternalQI).to.have.length(11);

          fetchMock.resetHistory();

          // Act 1 - add answer that does not meet the condition
          await insertAnswerAndReleaseQuestionnaireInstance(
            {
              question_id: 88888,
              answer_option_id: 88888,
              value: 'Nein',
            },
            addedExternalQI[0]!
          );

          // Act 2 - update questionnaire and keep the condition that is not met
          await txWait([
            {
              query:
                'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
              arg: {
                cycle_amount: 4,
                qId: 99999,
              },
            },
          ]);

          // Assert
          expect(
            fetchMock.calls('path:/questionnaire/questionnaireInstances')
          ).to.have.length(0);
        });

        it('should not create any instances of a deactivated questionnaire when a conditional questionnaire was answered', async function () {
          // Arrange
          await setupExternalConditionTestCase({
            conditionalQuestionnaire: {
              study_id: 'ApiTestStudie',
              name: 'TestDeactivatedQuestionnaire',
              active: false,
              no_questions: 2,
              cycle_amount: 1,
              cycle_unit: 'once',
              activate_after_days: 0,
              deactivate_after_days: 5,
              notification_tries: 0,
            },
          });

          const addedExternalQI =
            await insertAllQuestionnaireInstancesFromInternalApiCalls();

          expect(addedExternalQI).to.have.length(11);

          fetchMock.resetHistory();

          // Act - add answer that meets the condition
          await insertAnswerAndReleaseQuestionnaireInstance(
            {
              question_id: 88888,
              answer_option_id: 88888,
              value: 'Ja',
            },
            addedExternalQI[0]!
          );

          // Assert
          expect(
            fetchMock.calls('path:/questionnaire/questionnaireInstances')
          ).to.have.length(0);
        });

        it('should not create any questionnaire instances when adding a questionnaire with external condition that has no answer', async function () {
          const externalQuestionnaire: Partial<Questionnaire> = {
            id: 88888,
            study_id: 'ApiTestStudie',
            name: 'TestExternalQuestionnaire',
            no_questions: 2,
            cycle_amount: 2,
            cycle_unit: 'day',
            activate_after_days: 5,
            deactivate_after_days: 20,
            notification_tries: 3,
            notification_title: 'title',
            notification_body_new: 'new',
            notification_body_in_progress: 'old',
            created_at: addDays(startOfToday(), -100),
          };

          const externalQuestion = {
            id: 88888,
            questionnaire_id: 88888,
            text: 'Beispielfrage',
            position: 1,
            is_mandatory: false,
          };

          const externalAnswerOption = {
            id: 88888,
            question_id: 88888,
            text: 'Beispielunterfrage',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            position: 1,
          };

          const condition = {
            condition_type: 'external',
            condition_questionnaire_id: dailyQuestionnaireForProbands.id,
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: externalQuestionnaire.id,
            condition_target_answer_option: externalAnswerOption.id,
          };

          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire(externalQuestionnaire);
          await db.none(
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
            externalQuestion
          );
          await db.none(
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
            externalAnswerOption
          );

          await txWait([
            {
              query: getQuestionnaireInsertQuery(
                dailyQuestionnaireForProbands,
                false
              ),
              arg: dailyQuestionnaireForProbands,
            },
            {
              query:
                'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
              arg: dailyQuestionnaireQuestion,
            },
            {
              query:
                'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
              arg: dailyQuestionnaireAnswerOption,
            },
            {
              query:
                'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
              arg: condition,
            },
          ]);
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(0);
        });

        it('should not create questionnaire instances when adding a questionnaire with external condition that is not met', async function () {
          const externalQuestionnaire: Partial<Questionnaire> = {
            id: 88888,
            study_id: 'ApiTestStudie',
            name: 'TestExternalQuestionnaire',
            no_questions: 2,
            cycle_amount: 2,
            cycle_unit: 'day',
            activate_after_days: 5,
            deactivate_after_days: 20,
            notification_tries: 3,
            notification_title: 'title',
            notification_body_new: 'new',
            notification_body_in_progress: 'old',
            created_at: addDays(startOfToday(), -100),
          };

          const externalQuestion = {
            id: 88888,
            questionnaire_id: 88888,
            text: 'Beispielfrage',
            position: 1,
            is_mandatory: false,
          };

          const externalAnswerOption = {
            id: 88888,
            question_id: 88888,
            text: 'Beispielunterfrage',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            position: 1,
          };

          const condition = {
            condition_type: 'external',
            condition_questionnaire_id: dailyQuestionnaireForProbands.id,
            condition_operand: '=',
            condition_value: 'Ja',
            condition_target_questionnaire: externalQuestionnaire.id,
            condition_target_answer_option: externalAnswerOption.id,
          };

          await db.none(
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
            {
              date: subDays(new Date(), 5),
              pseudonym: 'qtest-proband1',
            }
          );
          await insertQuestionnaire(externalQuestionnaire);
          await insertLatestQuestionnaireInstancesFromInternalApiCalls();

          await db.none(
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
            externalQuestion
          );
          await db.none(
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
            externalAnswerOption
          );

          const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 88888 }
          );
          await dbWait(
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
            {
              status: 'released_once',
              date: new Date(),
              id: addedExternalQI[0]?.id,
            }
          );

          const externalAnswer = {
            questionnaire_instance_id: addedExternalQI[0]!.id,
            question_id: 88888,
            answer_option_id: 88888,
            value: 'Ja',
          };

          await db.none(
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
            externalAnswer
          );

          await txWait([
            {
              query: getQuestionnaireInsertQuery(
                dailyQuestionnaireForProbands,
                false
              ),
              arg: dailyQuestionnaireForProbands,
            },
            {
              query:
                'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
              arg: dailyQuestionnaireQuestion,
            },
            {
              query:
                'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
              arg: dailyQuestionnaireAnswerOption,
            },
            {
              query:
                'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
              arg: condition,
            },
          ]);

          await insertLatestQuestionnaireInstancesFromInternalApiCalls();

          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(0);
        });
      });
    });
  });

  describe('Autocreate/delete questionnaire instances on questionnaire instance status update for conditional questionnaires', () => {
    it('should not create any instances when inserting answers that dont meet external condition', async function () {
      // Arrange
      await setupExternalConditionTestCase();

      const externalInstances =
        await insertAllQuestionnaireInstancesFromInternalApiCalls();

      fetchMock.resetHistory();

      // Act
      await insertAnswerAndReleaseQuestionnaireInstance(
        {
          question_id: 88888,
          answer_option_id: 88888,
          value: 'Nein',
        },
        externalInstances[0]!
      );

      // Assert
      expect(fetchMock.calls()).to.have.length(0);
    });

    it('should create instances when inserting answers that meet external condition', async function () {
      // Arrange
      const pseudonym = 'qtest-proband1';
      const { conditionalQuestionnaire } = await setupExternalConditionTestCase(
        {
          conditionalQuestionnaire: {
            cycle_amount: 2,
            cycle_unit: 'day',
            activate_after_days: 0,
            deactivate_after_days: 15,
          },
        }
      );

      const externalInstances =
        await insertAllQuestionnaireInstancesFromInternalApiCalls();

      fetchMock.resetHistory();

      const expectedInstances = getCreateQuestionnaireInstanceInternalDtos(
        8,
        pseudonym,
        conditionalQuestionnaire,
        true,
        undefined,
        {
          condition: externalConditionId,
          originInstance: externalInstances[0]!.id,
        }
      );

      fetchMock.post(
        'path:/questionnaire/questionnaireInstances',
        {
          body: expectedInstances,
        },
        { overwriteRoutes: true }
      );

      fetchMock.resetHistory();

      // Act
      await insertAnswerAndReleaseQuestionnaireInstance(
        {
          question_id: 88888,
          answer_option_id: 88888,
          value: 'Ja',
        },
        externalInstances[0]!
      );

      // Assert
      const calls = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances');
      expect(calls).to.deep.equal(expectedInstances);
    });

    it('should create instances when updating answer that was not met before and setting instance to released_twice', async function () {
      // Arrange 1
      const pseudonym = 'qtest-proband1';
      const { conditionalQuestionnaire } =
        await setupExternalConditionTestCase();

      const addedExternalQI =
        await insertAllQuestionnaireInstancesFromInternalApiCalls();

      // Act 1
      fetchMock.resetHistory();

      await insertAnswerAndReleaseQuestionnaireInstance(
        {
          question_id: 88888,
          answer_option_id: 88888,
          value: 'Nein',
        },
        addedExternalQI[0]!
      );

      // Assert 1
      expect(fetchMock.calls()).to.have.length(0);

      // Arrange 2
      const expectedPayload = getCreateQuestionnaireInstanceInternalDtos(
        11,
        pseudonym,
        conditionalQuestionnaire,
        false,
        undefined,
        {
          condition: externalConditionId,
          originInstance: addedExternalQI[0]!.id,
        }
      );

      fetchMock.post(
        'path:/questionnaire/questionnaireInstances',
        {
          body: [JSON.parse(JSON.stringify(expectedPayload))],
        },
        { overwriteRoutes: true }
      );

      // Act 2
      await insertAnswerAndReleaseQuestionnaireInstance(
        {
          question_id: 88888,
          answer_option_id: 88888,
          value: 'Ja',
          versioning: 2,
        },
        addedExternalQI[0]!,
        'released_twice'
      );

      // Assert 2
      expect(fetchMock.called()).to.be.true;
      expect(
        getFetchMockCallPayload('path:/questionnaire/questionnaireInstances')
      ).to.deep.equal(JSON.parse(JSON.stringify(expectedPayload)));
    });

    it('should delete instances when updating answer that was met before but is not met now', async () => {
      // Arrange 1
      const pseudonym = 'qtest-proband1';
      const { externalQuestionnaire, conditionalQuestionnaire } =
        await setupExternalConditionTestCase();

      const externalQuestionnaireInstance = await insertQuestionnaireInstance(
        { user_id: pseudonym },
        externalQuestionnaire
      );

      const expectedPayload: CreateQuestionnaireInstanceInternalDto[] = [
        ...Array(11).keys(),
      ].map((idx: number) => ({
        questionnaireId: conditionalQuestionnaire.id,
        questionnaireVersion: conditionalQuestionnaire.version,
        questionnaireName: conditionalQuestionnaire.name,
        dateOfIssue: localTimeToUtc(
          addDays(
            addHours(startOfDay(new Date()), defaultNotificationTimeHour),
            conditionalQuestionnaire.activate_after_days +
              idx * conditionalQuestionnaire.cycle_amount
          )
        ),
        studyId: conditionalQuestionnaire.study_id,
        pseudonym,
        sortOrder: conditionalQuestionnaire.sort_order,
        cycle: idx + 1,
        status: 'inactive',
        options: { addToQueue: false },
        origin: {
          condition: externalConditionId,
          originInstance: externalQuestionnaireInstance.id,
        },
      }));

      fetchMock.post(
        'path:/questionnaire/questionnaireInstances',
        {
          body: [JSON.parse(JSON.stringify(expectedPayload))],
        },
        { overwriteRoutes: true }
      );

      // Act 1
      fetchMock.resetHistory();

      const externalAnswer1 = {
        questionnaire_instance_id: externalQuestionnaireInstance.id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: externalQuestionnaireInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer1,
        },
      ]);

      // Assert 1
      expect(fetchMock.called()).to.be.true;
      expect(
        getFetchMockCallPayload('path:/questionnaire/questionnaireInstances')
      ).to.deep.equal(JSON.parse(JSON.stringify(expectedPayload)));

      // Arrange 2 - We need to fake some instances as deleting is still crossing domain boundaries
      for (let idx = 0; idx < 11; idx++) {
        await insertQuestionnaireInstance(
          { user_id: pseudonym, cycle: idx + 1 },
          conditionalQuestionnaire
        );
      }

      // Act 2
      const externalAnswer2 = {
        questionnaire_instance_id: externalQuestionnaireInstance.id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Nein',
        versioning: 2,
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v2=${date} WHERE id=${id}',
          arg: {
            status: 'released_twice',
            date: new Date(),
            id: externalQuestionnaireInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value, versioning) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value}, ${versioning})',
          arg: externalAnswer2,
        },
      ]);

      // Assert 2
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: conditionalQuestionnaire.id }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should not create additional instances when updating answer that was met before and setting instance to released_twice', async function () {
      // Arrange 1
      const pseudonym = 'qtest-proband1';
      const { externalQuestionnaire, conditionalQuestionnaire } =
        await setupExternalConditionTestCase();

      const externalInstance = await insertQuestionnaireInstance(
        { user_id: pseudonym },
        externalQuestionnaire
      );

      const expectedInstances = getCreateQuestionnaireInstanceInternalDtos(
        11,
        pseudonym,
        conditionalQuestionnaire,
        true
      );

      fetchMock.post(
        'path:/questionnaire/questionnaireInstances',
        {
          body: expectedInstances,
        },
        { overwriteRoutes: true }
      );

      // Act 1
      const externalAnswer1 = {
        questionnaire_instance_id: externalInstance.id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: externalInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer1,
        },
      ]);

      // Assert
      expect(
        getFetchMockCallPayload<CreateQuestionnaireInstanceInternalDto[]>(
          'path:/questionnaire/questionnaireInstances'
        ).length
      ).to.deep.equal(11);

      // Act 2
      const externalAnswer2 = {
        questionnaire_instance_id: externalInstance.id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
        versioning: 2,
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v2=${date} WHERE id=${id}',
          arg: {
            status: 'released_twice',
            date: new Date(),
            id: externalInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value, versioning) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value}, ${versioning})',
          arg: externalAnswer2,
        },
      ]);

      // Assert 2 - We did not reset fetchMock history, so we still expect 11 calls, as before
      expect(
        getFetchMockCallPayload<CreateQuestionnaireInstanceInternalDto[]>(
          'path:/questionnaire/questionnaireInstances'
        ).length
      ).to.deep.equal(11);
    });

    it('should not create more instances when inserting answer that does not meet internal_last condition', async function () {
      // Arrange
      const pseudonym = 'qtest-proband1';
      const { conditionalQuestionnaire } = await setupConditionTestCase({
        condition: {
          condition_type: 'internal_last',
          condition_operand: '==',
          condition_value: 'Ja',
        },
      });

      const conditionalInstance = await insertQuestionnaireInstance(
        { user_id: pseudonym },
        conditionalQuestionnaire
      );

      // Act
      const internalAnswer = {
        questionnaire_instance_id: conditionalInstance.id,
        question_id: 99999,
        answer_option_id: 99999,
        value: 'Nein',
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: conditionalInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      // Assert
      expect(
        fetchMock.calls('path:/questionnaire/questionnaireInstances').length
      ).to.equal(1); // +1 for the initial questionnaire instance
    });

    it('should create one more instance when inserting answer that does meet internal_last condition', async function () {
      // Arrange
      const pseudonym = 'qtest-proband1';
      const { conditionalQuestionnaire } = await setupConditionTestCase({
        conditionalQuestionnaire: {},
        condition: {
          condition_type: 'internal_last',
          condition_operand: '==',
          condition_value: 'Ja',
        },
      });

      const expectedDateOfIssue = localTimeToUtc(
        addHours(addDays(startOfToday(), 2), defaultNotificationTimeHour)
      );

      // Insert instance which would exists after posting instances to questionnaire service
      const conditionalInstance = await insertQuestionnaireInstance(
        { user_id: pseudonym },
        conditionalQuestionnaire
      );

      fetchMock.resetHistory();

      // Act
      const internalAnswer = {
        questionnaire_instance_id: conditionalInstance.id,
        question_id: 99999,
        answer_option_id: 99999,
        value: 'Ja',
      };

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: conditionalInstance.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      expect(fetchMock.calls()).to.have.length(1);

      const addedQI = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances');

      const dateOfIssue = new Date(addedQI[0]!.dateOfIssue);
      expect(dateOfIssue.getTime()).to.equal(
        expectedDateOfIssue.getTime(),
        `dateOfIssue is ${dateOfIssue.toISOString()} but should be ${expectedDateOfIssue.toISOString()}`
      );
    });

    it('should create 3 more instances when inserting 3 answers that do meet internal_last condition for hourly questionnaire', async function () {
      // Arrange
      // const countInital;
      const pseudonym = 'qtest-proband1';
      const { conditionalQuestionnaire } = await setupConditionTestCase({
        conditionalQuestionnaire: {
          name: 'TestInternalLastHourly',
          cycle_amount: 5,
          cycle_unit: 'hour',
          cycle_per_day: 3,
          cycle_first_hour: 3,
          activate_after_days: 5,
          deactivate_after_days: 10,
        },
        condition: {
          condition_type: 'internal_last',
          condition_operand: '==',
          condition_value: 'Ja',
        },
      });

      // Act
      let lastCreatedQi: CreateQuestionnaireInstanceInternalDto =
        getFetchMockCallPayload<CreateQuestionnaireInstanceInternalDto[]>(
          'path:/questionnaire/questionnaireInstances'
        )[0]!;

      // We simulate creating instances by fetching the latest post request
      // Against the internal questionnaire service API and creating a new instance
      for (let cycle = 1; cycle < 4; cycle++) {
        const instance: Partial<QuestionnaireInstance> = {
          user_id: pseudonym,
          cycle,
        };

        instance.date_of_issue = new Date(lastCreatedQi.dateOfIssue);

        const conditionalQuestionnaireInstance =
          await insertQuestionnaireInstance(instance, conditionalQuestionnaire);

        await insertAnswerAndReleaseQuestionnaireInstance(
          {
            question_id: 99999,
            answer_option_id: 99999,
            value: 'Ja',
          },
          conditionalQuestionnaireInstance
        );

        expect(fetchMock.calls()).to.have.length(cycle + 1); // +1 for the initial questionnaire instance
        lastCreatedQi = getFetchMockCallPayload<
          CreateQuestionnaireInstanceInternalDto[]
        >('path:/questionnaire/questionnaireInstances')[0]!;
      }

      // Assert
      const addedQI =
        getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
          'path:/questionnaire/questionnaireInstances'
        );
      expect(addedQI).to.have.length(4);
      console.log(addedQI);

      const instance0 = addedQI[0]!;
      const dateOfIssue0 = new Date(instance0.dateOfIssue);
      const expectedDateOfIssue0 = localTimeToUtc(
        addHours(startOfToday(), 3 + 0 * 5)
      );
      expect(dateOfIssue0.getTime()).to.equal(
        expectedDateOfIssue0.getTime(),
        `dateOfIssue is ${dateOfIssue0.toISOString()} but should be ${expectedDateOfIssue0.toISOString()} for cycle ${
          instance0.cycle
        }`
      );

      const instance1 = addedQI[1]!;
      const dateOfIssue1 = new Date(instance1.dateOfIssue);
      const expectedDateOfIssue1 = localTimeToUtc(
        addHours(startOfToday(), 3 + 1 * 5)
      );
      expect(dateOfIssue1.getTime()).to.equal(
        expectedDateOfIssue1.getTime(),
        `dateOfIssue is ${dateOfIssue1.toISOString()} but should be ${expectedDateOfIssue1.toISOString()} for cycle ${
          instance1.cycle
        }`
      );

      const instance2 = addedQI[2]!;
      const dateOfIssue2 = new Date(instance2.dateOfIssue);
      const expectedDateOfIssue2 = localTimeToUtc(
        addHours(startOfToday(), 3 + 2 * 5)
      );
      expect(dateOfIssue2.getTime()).to.equal(
        expectedDateOfIssue2.getTime(),
        `dateOfIssue is ${dateOfIssue2.toISOString()} but should be ${expectedDateOfIssue2.toISOString()} for cycle ${
          instance2.cycle
        }`
      );

      const instance3 = addedQI[3]!;
      const dateOfIssue3 = new Date(instance3.dateOfIssue);
      const expectedDateOfIssue3 = localTimeToUtc(
        addHours(addDays(startOfToday(), 1), 3)
      );
      expect(dateOfIssue3.getTime()).to.equal(
        expectedDateOfIssue3.getTime(),
        `dateOfIssue is ${dateOfIssue3.toISOString()} but should be ${expectedDateOfIssue3.toISOString()} for cycle ${
          instance3.cycle
        }`
      );

      /*
      expect(addedQI.length).to.equal(4);
      expect(
        addedQI[0]!.date_of_issue.getTime() -
          localTimeToUtc(addHours(startOfToday(), 3)).getTime()
      ).to.equal(0);
      expect(
        addedQI[1]!.date_of_issue.getTime() -
          localTimeToUtc(addHours(startOfToday(), 3 + 5)).getTime()
      ).to.equal(0);
      expect(
        addedQI[2]!.date_of_issue.getTime() -
          localTimeToUtc(addHours(startOfToday(), 3 + 2 * 5)).getTime()
      ).to.equal(0);
      // should be on the next day
      expect(
        addedQI[3]!.date_of_issue.getTime() -
          localTimeToUtc(addHours(addDays(startOfToday(), 1), 3)).getTime()
      ).to.equal(0);
       */
    });

    it('should create one more instance for spontan questionnaire when last instance is released', async function () {
      const spontanQuestionnaire = createQuestionnaire({
        cycle_unit: 'spontan',
        notification_tries: 0,
        notification_title: '',
        notification_body_new: '',
        notification_body_in_progress: '',
        notification_weekday: null,
      });
      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          pseudonym: 'qtest-proband1',
        }
      );

      await insertQuestionnaire(spontanQuestionnaire);

      const addedInternalQIs = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances');

      expect(addedInternalQIs).to.have.length(1);

      const instance = await insertQuestionnaireInstance(
        {
          user_id: 'qtest-proband1',
          date_of_issue: addedInternalQIs[0]!.dateOfIssue,
        },
        spontanQuestionnaire as Questionnaire
      );

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date}, date_of_issue=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: localTimeToUtc(startOfToday()),
            id: instance.id,
          },
        },
      ]);

      // Assert
      const addedQIdb: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(
        addedQIdb[0]!.date_of_issue.getTime() -
          localTimeToUtc(startOfToday()).getTime()
      ).to.equal(
        0,
        'date_of_issue for first instance is not correct - it should be update when releasing the instance'
      );

      const addedQI =
        getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
          'path:/questionnaire/questionnaireInstances'
        );

      expect(addedQI.length).to.equal(2);
      expect(
        new Date(addedQI[1]!.dateOfIssue).getTime() -
          localTimeToUtc(startOfToday()).getTime()
      ).to.equal(0, 'dateOfIssue for second instance is not correct');
    });

    it('should not create one more instance for spontan questionnaire when last instance is released twice', async function () {
      const spontanQuestionnaire = createQuestionnaire({
        cycle_unit: 'spontan',
        notification_tries: 0,
        notification_title: '',
        notification_body_new: '',
        notification_body_in_progress: '',
        notification_weekday: null,
      });

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: fiveDaysAgo,
          pseudonym: 'qtest-proband1',
        }
      );

      await insertQuestionnaire(spontanQuestionnaire);

      expect(
        fetchMock.calls('path:/questionnaire/questionnaireInstances')
      ).to.have.length(1);

      const instance = await insertQuestionnaireInstance(
        { user_id: 'qtest-proband1' },
        spontanQuestionnaire as Questionnaire
      );

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: instance.id,
          },
        },
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v2=${date} WHERE id=${id}',
          arg: {
            status: 'released_twice',
            date: new Date(),
            id: instance.id,
          },
        },
      ]);

      expect(
        fetchMock.calls('path:/questionnaire/questionnaireInstances')
      ).to.have.length(2);
    });

    it('should create all instance queues when inserting answers that meet external condition', async function () {
      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          pseudonym: 'qtest-proband1',
        }
      );

      const questionnaireTemplate: Partial<Questionnaire> = {
        study_id: 'ApiTestStudie',
        name: 'firstQuestionnaire',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        deactivate_after_days: 15,
      };

      const firstQuestionnaire =
        await insertQuestionnairesWithQuestionsAndConditions({
          ...questionnaireTemplate,
          id: 88880,
        });

      const secondQuestionnaire =
        await insertQuestionnairesWithQuestionsAndConditions(
          {
            ...questionnaireTemplate,
            name: 'secondQuestionnaire',
            id: 88881,
          },
          {
            ...firstQuestionnaire,
            answerOptions: [firstQuestionnaire.answerOptions[0]!],
          }
        );

      await insertQuestionnairesWithQuestionsAndConditions(
        {
          ...questionnaireTemplate,
          name: 'thirdQuestionnaire',
          id: 88882,
        },
        {
          ...firstQuestionnaire,
          answerOptions: [firstQuestionnaire.answerOptions[1]!],
        }
      );

      await insertQuestionnairesWithQuestionsAndConditions(
        {
          ...questionnaireTemplate,
          name: 'fourthQuestionnaire',
          id: 88883,
        },
        {
          ...secondQuestionnaire,
          answerOptions: [secondQuestionnaire.answerOptions[0]!],
        }
      );

      const firstCreateQiRequest = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances');
      expect(firstCreateQiRequest).to.have.length(8);

      await insertQuestionnaireInstance(
        {
          user_id: 'qtest-proband1',
          cycle: firstCreateQiRequest[0]!.cycle,
          date_of_issue: firstCreateQiRequest[0]!.dateOfIssue,
        },
        firstQuestionnaire.questionnaire as Questionnaire
      );

      const addedFirstQI: QuestionnaireInstance = await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2 AND release_version=0',
        [firstQuestionnaire.questionnaire.id, 1]
      );
      const firstAnswerOption1Answer = {
        questionnaire_instance_id: addedFirstQI.id,
        question_id: firstQuestionnaire.question.id,
        answer_option_id: firstQuestionnaire.answerOptions[0]!.id,
        value: 'Ja',
      };
      const firstAnswerOption2Answer = {
        questionnaire_instance_id: addedFirstQI.id,
        question_id: firstQuestionnaire.question.id,
        answer_option_id: firstQuestionnaire.answerOptions[1]!.id,
        value: 'Ja',
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedFirstQI.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: firstAnswerOption1Answer,
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: firstAnswerOption2Answer,
        },
      ]);

      const secondCreateQiRequest = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances');

      await insertQuestionnaireInstance(
        {
          user_id: 'qtest-proband1',
          cycle: secondCreateQiRequest[0]!.cycle,
          date_of_issue: secondCreateQiRequest[0]!.dateOfIssue,
        },
        secondQuestionnaire.questionnaire as Questionnaire
      );

      const addedSecondQI: QuestionnaireInstance = await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [secondQuestionnaire.questionnaire.id, 1]
      );
      const secondAnswerOptionAnswer = {
        questionnaire_instance_id: addedSecondQI.id,
        question_id: secondQuestionnaire.question.id,
        answer_option_id: secondQuestionnaire.answerOptions[0]!.id,
        value: 'Ja',
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedSecondQI.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: secondAnswerOptionAnswer,
        },
      ]);

      const allCreatedInstance =
        getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
          'path:/questionnaire/questionnaireInstances'
        );

      expect(
        allCreatedInstance.filter(
          (qi) => qi.questionnaireName === 'firstQuestionnaire'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstance.filter(
          (qi) => qi.questionnaireName === 'secondQuestionnaire'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstance.filter(
          (qi) => qi.questionnaireName === 'thirdQuestionnaire'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstance.filter(
          (qi) => qi.questionnaireName === 'fourthQuestionnaire'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstance.filter((qi) => qi.options?.addToQueue === true)
      ).to.have.length(3);
    });

    it('should create instance queues only for research team questionnaires if proband is deactivated', async function () {
      /**
       * test questionnaire order:
       * -------------------------
       *
       *                    /--> secondQuestionnaire --> fourthQuestionnaire
       * firstQuestionnaire
       *                    \--> thirdQuestionnaire
       */

      const firstQuestionnaire: Partial<Questionnaire> = {
        id: 88880,
        study_id: 'ApiTestStudie',
        name: 'firstQuestionnaire',
        type: 'for_research_team',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: addDays(startOfToday(), -100),
      };

      const firstQuestion: Partial<Question> = {
        id: 88880,
        questionnaire_id: 88880,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const firstAnswerOption1: Partial<AnswerOption> = {
        id: 888801,
        question_id: 88880,
        text: 'Beispielunterfrage1',
        answer_type_id: 1,
        values: ["{ value: 'Ja' }", "{ value: 'Nein' }"],
        position: 1,
      };

      const firstAnswerOption2: Partial<AnswerOption> = {
        id: 888802,
        question_id: 88880,
        text: 'Beispielunterfrage2',
        answer_type_id: 1,
        values: ["{ value: 'Ja' }", "{ value: 'Nein' }"],
        position: 2,
      };

      const secondQuestionnaire: Partial<Questionnaire> = {
        id: 88881,
        study_id: 'ApiTestStudie',
        name: 'secondQuestionnaire',
        type: 'for_research_team',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: addDays(startOfToday(), -100),
      };

      const secondQuestion: Partial<Question> = {
        id: 88881,
        questionnaire_id: 88881,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const secondAnswerOption: Partial<AnswerOption> = {
        id: 88881,
        question_id: 88881,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: ["{ value: 'Ja' }", "{ value: 'Nein' }"],
        position: 1,
      };

      const thirdQuestionnaire: Partial<Questionnaire> = {
        id: 88882,
        study_id: 'ApiTestStudie',
        name: 'thirdQuestionnaire',
        type: 'for_probands',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: addDays(startOfToday(), -100),
      };

      const thirdQuestion: Partial<Question> = {
        id: 88882,
        questionnaire_id: 88882,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const thirdAnswerOption: Partial<AnswerOption> = {
        id: 88882,
        question_id: 88882,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: ["{ value: 'Ja' }", "{ value: 'Nein' }"],
        position: 1,
      };

      const fourthQuestionnaire: Partial<Questionnaire> = {
        id: 88883,
        study_id: 'ApiTestStudie',
        name: 'fourthQuestionnaire',
        type: 'for_probands',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: addDays(startOfToday(), -100),
      };

      const fourthQuestion: Partial<Question> = {
        id: 88883,
        questionnaire_id: 88883,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const fourthAnswerOption: Partial<AnswerOption> = {
        id: 88883,
        question_id: 88883,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: ["{ value: 'Ja' }", "{ value: 'Nein' }"],
        position: 1,
      };

      const condition1: Partial<Condition> = {
        condition_type: 'external',
        condition_questionnaire_id: secondQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: firstQuestionnaire.id,
        condition_target_answer_option: firstAnswerOption1.id,
      };

      const condition2: Partial<Condition> = {
        condition_type: 'external',
        condition_questionnaire_id: thirdQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: firstQuestionnaire.id,
        condition_target_answer_option: firstAnswerOption2.id,
      };

      const condition3: Partial<Condition> = {
        condition_type: 'external',
        condition_questionnaire_id: fourthQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: secondQuestionnaire.id,
        condition_target_answer_option: secondAnswerOption.id,
      };

      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date), status=$(status) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          status: 'deactivated',
          pseudonym: 'qtest-proband1',
        }
      );

      await txWait([
        {
          query: getQuestionnaireInsertQuery(firstQuestionnaire, false),
          arg: firstQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: firstQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: firstAnswerOption1,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: firstAnswerOption2,
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(secondQuestionnaire, false),
          arg: secondQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: secondQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: secondAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition1,
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(thirdQuestionnaire, false),
          arg: thirdQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: thirdQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: thirdAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition2,
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(fourthQuestionnaire, false),
          arg: fourthQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: fourthQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: fourthAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition3,
        },
      ]);

      const firstQi = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances').find(
        (qi) => qi.questionnaireName === 'firstQuestionnaire' && qi.cycle === 1
      );

      await insertQuestionnaireInstance(
        {
          user_id: 'qtest-proband1',
          cycle: firstQi!.cycle,
          date_of_issue: firstQi!.dateOfIssue,
        },
        { id: firstQuestionnaire.id!, version: 1, name: 'firstQuestionnaire' }
      );

      const addedFirstQI: QuestionnaireInstance = await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2 AND release_version=0 AND user_id=$3',
        [firstQuestionnaire.id, 1, 'qtest-proband1']
      );

      const firstAnswerOption1Answer = {
        questionnaire_instance_id: addedFirstQI.id,
        question_id: firstQuestion.id,
        answer_option_id: firstAnswerOption1.id,
        value: 'Ja',
      };
      const firstAnswerOption2Answer = {
        questionnaire_instance_id: addedFirstQI.id,
        question_id: firstQuestion.id,
        answer_option_id: firstAnswerOption2.id,
        value: 'Ja',
      };

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedFirstQI.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: firstAnswerOption1Answer,
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: firstAnswerOption2Answer,
        },
      ]);

      const secondQi = getFetchMockCallPayload<
        CreateQuestionnaireInstanceInternalDto[]
      >('path:/questionnaire/questionnaireInstances').find(
        (qi) => qi.questionnaireName === 'secondQuestionnaire' && qi.cycle === 1
      );

      await insertQuestionnaireInstance(
        {
          user_id: 'qtest-proband1',
          cycle: 1,
          date_of_issue: secondQi!.dateOfIssue,
        },
        { id: secondQuestionnaire.id!, version: 1, name: 'secondQuestionnaire' }
      );

      const addedSecondQI: QuestionnaireInstance = await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [secondQuestionnaire.id, 1]
      );
      const secondAnswerOptionAnswer = {
        questionnaire_instance_id: addedSecondQI.id,
        question_id: secondQuestion.id,
        answer_option_id: secondAnswerOption.id,
        value: 'Ja',
      };
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedSecondQI.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: secondAnswerOptionAnswer,
        },
      ]);

      const allCreatedInstances =
        getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
          'path:/questionnaire/questionnaireInstances'
        );

      expect(
        allCreatedInstances.filter(
          (qi) =>
            qi.questionnaireName === 'firstQuestionnaire' &&
            qi.pseudonym === 'qtest-proband1'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstances.filter(
          (qi) =>
            qi.questionnaireName === 'firstQuestionnaire' &&
            qi.pseudonym === 'qtest-proband2'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstances.filter(
          (qi) => qi.questionnaireName === 'secondQuestionnaire'
        )
      ).to.have.length(8);

      expect(
        allCreatedInstances.filter(
          (qi) => qi.questionnaireName === 'thirdQuestionnaire'
        )
      ).to.have.length(0);

      expect(
        allCreatedInstances.filter(
          (qi) => qi.questionnaireName === 'fourthQuestionnaire'
        )
      ).to.have.length(0);

      expect(
        allCreatedInstances.filter((qi) => qi.options?.addToQueue === true)
      ).to.have.length(0);

      // const thirdQi: QuestionnaireInstance | null = await db.oneOrNone(
      //   'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
      //   [thirdQuestionnaire.id, 1]
      // );
      // const fourthQi: QuestionnaireInstance | null = await db.oneOrNone(
      //   'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
      //   [fourthQuestionnaire.id, 1]
      // );
      // expect(thirdQi).to.be.null;
      // expect(fourthQi).to.be.null;
      //
      // const queues = await db.manyOrNone(
      //   "SELECT * FROM questionnaire_instances_queued WHERE user_id='qtest-proband1'"
      // );
      // expect(queues.length).to.equal(0);

      Mockdate.reset();
    });
  });

  function createQuestionnaire(
    overwrites: Partial<Questionnaire> = {}
  ): Partial<Questionnaire> {
    const CREATED_BEFORE_DAYS = -100;
    return {
      id: 99999,
      version: 1,
      study_id: 'ApiTestStudie',
      name: 'TestQuestionnaire',
      custom_name: 'TestQuestionnaireCustomName',
      sort_order: 5,
      no_questions: 2,
      cycle_amount: 0,
      cycle_unit: 'once',
      activate_after_days: 0,
      deactivate_after_days: 0,
      notification_tries: 3,
      notification_title: 'title',
      notification_body_new: 'new',
      notification_body_in_progress: 'old',
      notification_weekday: null,
      notification_interval: 0,
      notification_interval_unit: 'days',
      type: 'for_probands',
      activate_at_date: format(startOfToday(), 'yyyy.MM.dd'),
      created_at: addDays(startOfToday(), CREATED_BEFORE_DAYS),
      ...overwrites,
    };
  }

  /**
   * @param expression URL expression
   * @param callIndex if not provided, the last call is returned
   */
  function getFetchMockCallPayload<T>(
    expression: string,
    callIndex?: number
  ): T {
    const calls = fetchMock.calls(expression);
    callIndex = callIndex ?? calls.length - 1;

    expect(calls).to.have.length.greaterThan(
      0,
      `No calls for ${expression} were found.`
    );

    return JSON.parse(calls[callIndex]![1]!.body as unknown as string) as T;
  }

  /**
   * Returns the payloads of all calls, flattened
   * @param expression URL expression
   */
  function getFetchMockCallsPayloads<T>(expression: string): T[] {
    return fetchMock
      .calls(expression)
      .flatMap((call) => JSON.parse(call[1]!.body as unknown as string) as T);
  }

  function nextDayXOfWeek(date: Date, day: number): Date {
    const theNextDay = setDay(date, day);
    if (date > theNextDay) {
      return addWeeks(theNextDay, 1);
    }
    return theNextDay;
  }

  async function insertParticipant(
    participant: Pick<
      Proband,
      'pseudonym' | 'status' | 'study' | 'first_logged_in_at'
    >
  ): Promise<void> {
    await db.none(
      'INSERT INTO probands (pseudonym, status, study, first_logged_in_at) VALUES ($(pseudonym), $(status), $(study), $(first_logged_in_at))',
      participant
    );
  }

  async function updateParticipant(
    pseudonym: string,
    participant: Partial<Proband>
  ): Promise<void> {
    await db.none(
      getUpdateQuery('probands', participant) +
        ' WHERE pseudonym = $(pseudonym)',
      {
        ...participant,
        pseudonym,
      }
    );
  }

  async function insertAllQuestionnaireInstancesFromInternalApiCalls(): Promise<
    QuestionnaireInstance[]
  > {
    const insertedQuestionnaires =
      getFetchMockCallsPayloads<CreateQuestionnaireInstanceInternalDto>(
        'path:/questionnaire/questionnaireInstances'
      );

    return insertQuestionnaireInstancesFromInteralDtos(insertedQuestionnaires);
  }

  async function insertLatestQuestionnaireInstancesFromInternalApiCalls(): Promise<
    QuestionnaireInstance[]
  > {
    const insertedQuestionnaires = getFetchMockCallPayload<
      CreateQuestionnaireInstanceInternalDto[]
    >('path:/questionnaire/questionnaireInstances');

    return insertQuestionnaireInstancesFromInteralDtos(insertedQuestionnaires);
  }

  async function insertQuestionnaireInstancesFromInteralDtos(
    dtos: CreateQuestionnaireInstanceInternalDto[]
  ): Promise<QuestionnaireInstance[]> {
    const instances: Promise<QuestionnaireInstance>[] = [];

    for (const qi of dtos) {
      const questionnaire = await db.one<Questionnaire>(
        'SELECT * FROM questionnaires WHERE id = $1 AND version = $2',
        [qi.questionnaireId, qi.questionnaireVersion]
      );
      instances.push(
        insertQuestionnaireInstance(
          {
            user_id: qi.pseudonym,
            cycle: qi.cycle,
            date_of_issue: qi.dateOfIssue,
            status: qi.status,
            sort_order: qi.sortOrder,
          },
          questionnaire
        )
      );
    }

    return Promise.all(instances);
  }

  async function deleteParticipant(pseudonym: string): Promise<void> {
    await db.none('DELETE FROM probands WHERE pseudonym = $1', pseudonym);
  }

  function getUpdateQuery(table: string, object: object): string {
    const setQuery = Object.keys(object)
      .map((key) => `${key} = $(${key})`)
      .join(', ');

    return `UPDATE ${table} SET ${setQuery}`;
  }

  function getQuestionnaireInsertQuery(
    questionnaire: Partial<Questionnaire>,
    returning = true
  ): string {
    return getInsertQuery('questionnaires', questionnaire, returning);
  }

  async function insertQuestionnaire(
    overwrites: Partial<Questionnaire> = {}
  ): Promise<Questionnaire> {
    const questionnaire = createQuestionnaire(overwrites);

    const result = await dbWaitWithReturn<Questionnaire[]>(
      getQuestionnaireInsertQuery(questionnaire),
      questionnaire
    );

    return result[0]!;
  }

  async function insertQuestionnaireInstance(
    questionnaireInstance: Partial<QuestionnaireInstance>,
    questionnaire: Pick<Questionnaire, 'id' | 'version' | 'name'>
  ): Promise<QuestionnaireInstance> {
    const qi: Partial<QuestionnaireInstance> = {
      questionnaire_id: questionnaire.id,
      questionnaire_version: questionnaire.version,
      questionnaire_name: questionnaire.name,
      cycle: 1,
      date_of_issue: localTimeToUtc(
        addHours(startOfToday(), config.notificationTime.hours)
      ),
      user_id: 'qtest-proband1',
      study_id: 'ApiTestStudie',
      status: 'inactive',
      ...questionnaireInstance,
    };

    const result = await dbWaitWithReturn<QuestionnaireInstance[]>(
      getInsertQuery('questionnaire_instances', qi),
      qi
    );

    return result[0]!;
  }

  async function sendProbandCreatedMessage(
    pseudonym: string,
    studyName: string
  ): Promise<void> {
    const processedProbandCreated =
      MessageQueueTestUtils.injectMessageProcessedAwaiter(
        messageQueueService,
        MessageQueueTopic.PROBAND_CREATED
      );

    const probandCreated = await mqc.createProducer(
      MessageQueueTopic.PROBAND_CREATED
    );

    await probandCreated.publish({ pseudonym, studyName });

    await processedProbandCreated;
  }

  async function insertQuestionnairesWithQuestionsAndConditions(
    questionnaireTemplate: PartialWithRequiredId<Questionnaire>,
    targetQuestionnaire?: QuestionnaireWithQuestions
  ): Promise<QuestionnaireWithQuestions> {
    const questionnaire = createQuestionnaire({
      ...questionnaireTemplate,
      custom_name:
        (questionnaireTemplate.custom_name ?? 'TestQuestionnaire') +
        questionnaireTemplate.id.toString(),
    }) as PartialWithRequiredId<Questionnaire>;

    const question: PartialWithRequiredId<Question> = {
      id: 1 + questionnaire.id * 10,
      questionnaire_id: questionnaire.id,
      questionnaire_version: 1,
      text: 'Beispielfrage',
      position: 1,
      is_mandatory: false,
    };

    const answerOptions: PartialWithRequiredId<AnswerOption>[] = [
      ...Array(2).keys(),
    ].map((_, i) => ({
      id: i + 1 + questionnaire.id * 100,
      question_id: question.id,
      text: `Subquestion ${i + 1}`,
      answer_type_id: 1,
      values: ['Ja', 'Nein'],
      position: i + 1,
    }));

    const condition: Partial<Condition> | null = targetQuestionnaire
      ? {
          condition_type: 'external',
          condition_questionnaire_id: questionnaire.id,
          condition_operand: '==',
          condition_value: 'Ja',
          condition_target_questionnaire: targetQuestionnaire.questionnaire.id,
          condition_target_answer_option:
            targetQuestionnaire.answerOptions[0]!.id,
        }
      : null;

    await txWait([
      {
        query: getQuestionnaireInsertQuery(questionnaire, false),
        arg: questionnaire,
      },
      {
        query: getInsertQuery('questions', question, false),
        arg: question,
      },
      ...answerOptions.map((answerOption) => ({
        query: getInsertQuery('answer_options', answerOption, false),
        arg: answerOption,
      })),
      ...(condition
        ? [
            {
              query: getInsertQuery('conditions', condition, false),
              arg: condition,
            },
          ]
        : []),
    ]);

    return {
      questionnaire,
      question,
      answerOptions,
    };
  }

  async function setupQuestionnaire(
    overwriteQuestionnaire: Partial<Questionnaire> = {},
    condition: Partial<Condition> | null = null
  ): Promise<{
    questionnaire: Questionnaire;
    question: Pick<Question, 'id'>;
    answerOption: Pick<AnswerOption, 'id'>;
  }> {
    const questionnaire = createQuestionnaire({
      ...dailyQuestionnaireForProbands,
      ...overwriteQuestionnaire,
    }) as Questionnaire;

    const question = {
      id: 99999,
      questionnaire_id: questionnaire.id,
      questionnaire_version: questionnaire.version,
      text: 'Beispielfrage',
      position: 1,
      is_mandatory: false,
    };

    const answerOption = {
      id: 99999,
      question_id: 99999,
      text: 'Beispielunterfrage',
      answer_type_id: 1,
      values: [{ value: 'Ja' }, { value: 'Nein' }],
      position: 1,
    };

    await txWait([
      {
        query: getQuestionnaireInsertQuery(questionnaire, false),
        arg: questionnaire,
      },
      {
        query:
          'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        arg: question,
      },
      {
        query:
          'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        arg: answerOption,
      },
      ...(condition
        ? [
            {
              query: getInsertQuery('conditions', condition, false),
              arg: condition,
            },
          ]
        : []),
    ]);

    return { questionnaire, question, answerOption };
  }

  async function setupExternalConditionTestCase(
    overwrite: {
      condition?: Partial<Condition> | null;
      conditionalQuestionnaire?: Partial<Questionnaire>;
      externalQuestionnaire?: Partial<Questionnaire>;
    } = {
      condition: {},
      conditionalQuestionnaire: {},
      externalQuestionnaire: {},
    }
  ): Promise<{
    externalQuestionnaire: Questionnaire;
    conditionalQuestionnaire: Questionnaire;
  }> {
    await updateParticipant('qtest-proband1', {
      first_logged_in_at: subDays(new Date(), 5),
    });

    const externalQuestionnaire = await insertQuestionnaire({
      id: 88888,
      study_id: 'ApiTestStudie',
      name: 'TestExternalQuestionnaire',
      custom_name: 'ExtCustomName',
      no_questions: 2,
      cycle_amount: 2,
      cycle_unit: 'day',
      activate_after_days: 5,
      deactivate_after_days: 20,
      notification_tries: 3,
      notification_title: 'title',
      notification_body_new: 'new',
      notification_body_in_progress: 'old',
      created_at: addDays(startOfToday(), -100),
      ...overwrite.externalQuestionnaire,
    });

    const externalQuestion = {
      id: 88888,
      questionnaire_id: 88888,
      text: 'Beispielfrage',
      position: 1,
      is_mandatory: false,
    };

    const externalAnswerOption = {
      id: 88888,
      question_id: 88888,
      text: 'Beispielunterfrage',
      answer_type_id: 1,
      values: [{ value: 'Ja' }, { value: 'Nein' }],
      position: 1,
    };

    await txWait([
      // {
      //   query: getQuestionnaireInsertQuery(externalQuestionnaire, false),
      //   arg: externalQuestionnaire,
      // },
      {
        query: getInsertQuery('questions', externalQuestion, false),
        arg: externalQuestion,
      },
      {
        query: getInsertQuery('answer_options', externalAnswerOption, false),
        arg: externalAnswerOption,
      },
    ]);

    const condition: Partial<Condition> | null =
      overwrite.condition === null
        ? null
        : {
            id: externalConditionId,
            condition_type: 'external',
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: externalQuestionnaire.id,
            condition_target_answer_option: externalAnswerOption.id,
            ...overwrite.condition,
          };

    const { conditionalQuestionnaire } = await setupConditionTestCase({
      condition,
      conditionalQuestionnaire: overwrite.conditionalQuestionnaire,
    });

    return {
      conditionalQuestionnaire,
      externalQuestionnaire,
    };
  }

  async function setupConditionTestCase(
    overwrite: {
      condition?: Partial<Condition> | null;
      conditionalQuestionnaire?: Partial<Questionnaire>;
    } = {
      condition: {},
      conditionalQuestionnaire: {},
    }
  ): Promise<{
    conditionalQuestionnaire: Questionnaire;
  }> {
    await updateParticipant('qtest-proband1', {
      first_logged_in_at: subDays(new Date(), 5),
    });

    let condition: Partial<Condition> | null = {};

    if (overwrite.condition === null) {
      condition = null;
    } else {
      switch (overwrite.condition?.condition_type) {
        case 'external':
          condition = {
            condition_type: 'external',
            condition_questionnaire_id: 99999,
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: 88888,
            condition_target_answer_option: 88888,
            ...overwrite.condition,
          };
          break;
        case 'internal_last':
          condition = {
            condition_type: 'internal_last',
            condition_questionnaire_id: 99999,
            condition_operand: '==',
            condition_value: 'Ja',
            condition_target_questionnaire: 99999,
            condition_target_answer_option: 99999,
            ...overwrite.condition,
          };
          break;
        default:
          expect.fail('setupExternalConditionTestCase: Invalid condition_type');
      }
    }

    const { questionnaire: conditionalQuestionnaire } =
      await setupQuestionnaire(
        {
          ...dailyQuestionnaireForProbands,
          ...overwrite.conditionalQuestionnaire,
        },
        condition
      );

    return {
      conditionalQuestionnaire,
    };
  }

  async function insertAnswerAndReleaseQuestionnaireInstance(
    answer: Partial<Answer>,
    questionnaireInstance: Pick<QuestionnaireInstance, 'id'>,
    status: QuestionnaireInstanceStatus = 'released_once'
  ): Promise<void> {
    let releaseField = 'date_of_release_v1';

    if (status === 'released_twice') {
      releaseField = 'date_of_release_v2';
    }

    answer = {
      ...answer,
      questionnaire_instance_id: questionnaireInstance.id,
    };

    await txWait([
      {
        query: `UPDATE questionnaire_instances SET status=$\{status}, ${releaseField}=$\{date} WHERE id=$\{id}`,
        arg: {
          status: status,
          date: new Date(),
          id: questionnaireInstance.id,
        },
      },

      {
        query: getInsertQuery('answers', answer, false),
        arg: answer,
      },
    ]);
  }

  function getCreateQuestionnaireInstanceInternalDtos(
    count: number,
    pseudonym: string,
    questionnaire: Questionnaire,
    addActiveToQueue = false,
    cycleOffset = 0,
    origin: CreateQuestionnaireInstanceInternalDto['origin'] = null
  ): CreateQuestionnaireInstanceInternalDtoJsonResponse[] {
    return [...Array(count).keys()].map((idx: number) => {
      const dateOfIssue = addDays(
        addHours(startOfDay(new Date()), defaultNotificationTimeHour),
        questionnaire.activate_after_days + questionnaire.cycle_amount * idx
      );

      const isActive = dateOfIssue <= new Date();

      return {
        questionnaireId: questionnaire.id,
        questionnaireVersion: questionnaire.version,
        questionnaireName: questionnaire.name,
        dateOfIssue: localTimeToUtc(dateOfIssue).toISOString(),
        studyId: questionnaire.study_id,
        pseudonym,
        sortOrder: questionnaire.sort_order,
        cycle: idx + 1 + cycleOffset,
        status: isActive ? 'active' : 'inactive',
        options: { addToQueue: addActiveToQueue && isActive },
        origin: origin,
      };
    });
  }
});

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
import { zonedTimeToUtc } from 'date-fns-tz';
import * as Mockdate from 'mockdate';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  MessageQueueTopic,
  QuestionnaireInstanceCreatedMessage,
} from '@pia/lib-messagequeue';

import {
  cleanup,
  setup,
} from './questionnaireInstanceCreation.spec.data/setup.helper';
import { dbWait, txWait, waitForConditionToBeTrue } from './helper';
import { config } from '../../src/config';
import { messageQueueService } from '../../src/services/messageQueueService';
import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';
import { Questionnaire } from '../../src/models/questionnaire';
import { Question } from '../../src/models/question';
import { AnswerOption } from '../../src/models/answerOption';
import { Condition } from '../../src/models/condition';
import { Proband } from '../../src/models/proband';
import { createSandbox } from 'sinon';

type PartialWithRequiredId<T extends { id: number }> = Partial<Omit<T, 'id'>> &
  Pick<T, 'id'>;

interface QuestionnaireWithQuestions {
  questionnaire: PartialWithRequiredId<Questionnaire>;
  question: PartialWithRequiredId<Question>;
  answerOptions: PartialWithRequiredId<AnswerOption>[];
}

function localTimeToUtc(date: Date): Date {
  return zonedTimeToUtc(date, config.timeZone);
}

describe('Questionnaire instance creation', function () {
  const CREATED_BEFORE_500_DAYS = -500;
  const testSandbox = createSandbox();
  const defaultNotificationTimeHour = config.notificationTime.hours;
  const mqc = new MessageQueueClient({
    ...config.servers.messageQueue,
    serviceName: 'test',
  });

  const messageHistory: QuestionnaireInstanceCreatedMessage[] = [];

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

    await mqc.createConsumer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED,
      async (message) => {
        messageHistory.push(message);
        return Promise.resolve();
      }
    );
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

    await setup();
  });

  afterEach(async () => {
    await cleanup();
    messageHistory.length = 0;
    testSandbox.restore();
    Mockdate.reset();
  });

  describe('Autocreate/delete questionnaire instances on proband creation / deletion', () => {
    it('should create questionnaire instances for research_team on proband.created message', async () => {
      const pseudonym = 'qtest-proband1';
      const studyName = 'ApiTestStudie';
      const dateOfQuestionnaireCreation = subDays(new Date(), 100);

      await deleteParticipant(pseudonym);
      await insertQuestionnaire({
        type: 'for_research_team',
        created_at: dateOfQuestionnaireCreation,
        sort_order: 3,
      });
      await insertParticipant({
        pseudonym,
        status: 'active',
        study: studyName,
        first_logged_in_at: null,
      });
      await sendProbandCreatedMessage(pseudonym, studyName);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);

      expect(
        addedQI[1]!.date_of_issue.getTime() -
          localTimeToUtc(
            addHours(
              startOfDay(dateOfQuestionnaireCreation),
              defaultNotificationTimeHour
            )
          ).getTime()
      ).to.equal(0);
      expect(addedQI[1]?.study_id).to.equal('ApiTestStudie');
      expect(addedQI[1]?.user_id).to.equal(pseudonym);
      expect(addedQI[1]?.cycle).to.equal(1);
      expect(addedQI[1]?.sort_order).to.equal(3);
    });

    it('should send a message on questionnaire instance creation', async () => {
      const pseudonym = 'qtest-proband1';
      const studyName = 'ApiTestStudie';
      const customName = 'CustomName';
      const questionnaireInstanceCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          mqc,
          MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED,
          testSandbox
        );

      await deleteParticipant(pseudonym);
      await deleteParticipant('qtest-proband2');
      await insertQuestionnaire({
        type: 'for_research_team',
        study_id: studyName,
        custom_name: customName,
      });
      await insertParticipant({
        pseudonym,
        status: 'active',
        study: studyName,
        first_logged_in_at: null,
      });
      await sendProbandCreatedMessage(pseudonym, studyName);

      expect((await questionnaireInstanceCreated).message).to.deep.equal({
        id: 3,
        studyName,
        pseudonym,
        status: 'active',
        questionnaire: {
          id: 99999,
          customName,
        },
      });
    });

    it('should delete questionnaire instances on proband deleted message', async () => {
      const pseudonym = 'qtest-proband1';

      await db.none('DELETE FROM probands WHERE pseudonym=$(pseudonym)', {
        pseudonym: pseudonym,
      });

      await insertQuestionnaire({ type: 'for_research_team' });

      await db.none(
        'INSERT INTO probands (pseudonym, status, study, first_logged_in_at) VALUES ($(pseudonym), $(status), $(study), $(first_logged_in_at))',
        {
          pseudonym: pseudonym,
          status: 'active',
          study: 'ApiTestStudie',
          first_logged_in_at: null,
        }
      );

      const processedProbandCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          MessageQueueTopic.PROBAND_CREATED
        );

      const probandCreated = await mqc.createProducer(
        MessageQueueTopic.PROBAND_CREATED
      );
      await probandCreated.publish({
        pseudonym,
        studyName: 'ApiTestStudie',
      });

      await processedProbandCreated;

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
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
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
      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(0);
      expect((await getCreatedMessagesForId(99999)).length).to.equal(0);
    });

    it('should not create any instances when user is active in study but no questionnaire was added', async function () {
      await db.none(
        'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
        {
          date: subDays(new Date(), 5),
          pseudonym: 'qtest-proband1',
        }
      );
      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(0);
      expect(await getCreatedMessagesForId(99999)).to.have.length(0);
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
      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(expectedQuestionnaireInstanceCount);

      // Act
      await dbWait('UPDATE questionnaires SET active=false WHERE id=${qId}', {
        qId: 99999,
      });
      const qis = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      // Assert
      expect(qis.length).to.equal(expectedQuestionnaireInstanceCount);
    });

    context('dated questionnaires', () => {
      it('should create correct questionnaire instances when adding a questionnaire with set date without the user having been logged in before', async function () {
        await insertQuestionnaire(dateQuestionnaire);
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(1);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(
              addHours(startOfToday(), defaultNotificationTimeHour)
            ).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);

        const messages = await getCreatedMessagesForId(99999);
        expect(messages.length).to.equal(1);

        const expectedMessage: Partial<QuestionnaireInstanceCreatedMessage> = {
          id: addedQI[0]!.id,
          studyName: 'ApiTestStudie',
          pseudonym: 'qtest-proband1',
          status: 'active',
          questionnaire: {
            id: 99999,
            customName: 'TestQuestionnaireCustomName',
          },
        };

        expect(messages[0]).to.deep.equal(expectedMessage);
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
        expect(new Date(addedQI[0]!.date_of_issue).toISOString()).to.equal(
          localTimeToUtc(
            addHours(startOfToday(), defaultNotificationTimeHour)
          ).toISOString()
        );

        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(
              subDays(addHours(startOfToday(), defaultNotificationTimeHour), 4)
            ).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);

        expect((await getCreatedMessagesForId(99999)).length).to.equal(1);
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
        const dateNo = subDays(new Date(), 5).getDay();
        expect(addedQI[0]?.date_of_issue.getDay()).to.equal(dateNo);

        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(
              subDays(addHours(startOfToday(), defaultNotificationTimeHour), 5)
            ).getTime()
        ).to.equal(0);

        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);

        expect((await getCreatedMessagesForId(99999)).length).to.equal(1);
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(addDays(startOfToday(), -10)).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(addDays(startOfToday(), -5)).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
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
        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(11);

        await dbWait(
          'UPDATE questionnaires SET cycle_unit=${cycle_unit} WHERE id=${qId}',
          {
            cycle_unit: 'spontan',
            qId: 99999,
          }
        );

        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
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
        await dbWait(
          'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
          {
            cycle_amount: 4,
            qId: 99999,
          }
        );
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(6);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(
              addHours(startOfToday(), defaultNotificationTimeHour)
            ).getTime()
        ).to.equal(0);
        expect(
          addedQI[1]!.date_of_issue.getTime() -
            localTimeToUtc(
              addDays(addHours(startOfToday(), defaultNotificationTimeHour), 4)
            ).getTime()
        ).to.equal(0);
        expect(
          addedQI[5]!.date_of_issue.getTime() -
            localTimeToUtc(
              addDays(addHours(startOfToday(), defaultNotificationTimeHour), 20)
            ).getTime()
        ).to.equal(0);

        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[1]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[5]?.study_id).to.equal('ApiTestStudie');

        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[1]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[5]?.user_id).to.equal('qtest-proband1');

        expect(addedQI[0]?.sort_order).to.equal(7);
        expect(addedQI[1]?.sort_order).to.equal(7);
        expect(addedQI[5]?.sort_order).to.equal(7);
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(22);

          for (let i = 0; i < addedQI.length; i++) {
            expect(addedQI[i]?.study_id).to.equal('ApiTestStudie');
            expect(addedQI[i]?.user_id).to.equal('qtest-proband1');
            expect(addedQI[i]?.date_of_issue.toString()).to.equal(
              localTimeToUtc(
                setHours(
                  addDays(startOfToday(), (i - (i % 2)) / 2),
                  3 + (i % 2) * 12
                )
              ).toString()
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(33);

          expect(
            addedQI[0]!.date_of_issue.getTime() -
              localTimeToUtc(addHours(startOfToday(), 3)).getTime()
          ).to.equal(0);
          expect(
            addedQI[1]!.date_of_issue.getTime() -
              localTimeToUtc(addHours(startOfToday(), 3 + 5)).getTime()
          ).to.equal(0);
          expect(
            addedQI[5]!.date_of_issue.getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 1), 3 + 2 * 5)
              ).getTime()
          ).to.equal(0);
          expect(
            addedQI[32]!.date_of_issue.getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 10), 3 + 2 * 5)
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[1]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[32]?.study_id).to.equal('ApiTestStudie');

          expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[1]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[32]?.user_id).to.equal('qtest-proband1');

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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(33);

          expect(
            addedQI[0]!.date_of_issue.getTime() -
              localTimeToUtc(addHours(startOfToday(), 3)).getTime()
          ).to.equal(0);
          expect(
            addedQI[1]!.date_of_issue.getTime() -
              localTimeToUtc(addHours(startOfToday(), 3 + 1)).getTime()
          ).to.equal(0);
          expect(
            addedQI[5]!.date_of_issue.getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 1), 3 + 2)
              ).getTime()
          ).to.equal(0);
          expect(
            addedQI[32]!.date_of_issue.getTime() -
              localTimeToUtc(
                addHours(addDays(startOfToday(), 10), 3 + 2)
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[1]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[32]?.study_id).to.equal('ApiTestStudie');

          expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[1]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[32]?.user_id).to.equal('qtest-proband1');

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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(11);
          expect(
            addedQI[0]!.date_of_issue.getTime() -
              localTimeToUtc(
                addHours(startOfToday(), defaultNotificationTimeHour)
              ).getTime()
          ).to.equal(0);
          expect(
            addedQI[1]!.date_of_issue.getTime() -
              localTimeToUtc(
                addDays(
                  addHours(startOfToday(), defaultNotificationTimeHour),
                  2
                )
              ).getTime()
          ).to.equal(0);
          expect(
            addedQI[10]!.date_of_issue.getTime() -
              localTimeToUtc(
                addDays(
                  addHours(startOfToday(), defaultNotificationTimeHour),
                  20
                )
              ).getTime()
          ).to.equal(0);

          expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[1]?.study_id).to.equal('ApiTestStudie');
          expect(addedQI[10]?.study_id).to.equal('ApiTestStudie');

          expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[1]?.user_id).to.equal('qtest-proband1');
          expect(addedQI[10]?.user_id).to.equal('qtest-proband1');

          expect(addedQI[0]?.cycle).to.equal(1);
          expect(addedQI[1]?.cycle).to.equal(2);
          expect(addedQI[10]?.cycle).to.equal(11);

          expect(addedQI[0]?.sort_order).to.equal(7);
          expect(addedQI[1]?.sort_order).to.equal(7);
          expect(addedQI[10]?.sort_order).to.equal(7);
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(8);
          addedQI.forEach((qi, i) => {
            expect(qi.study_id).to.equal('ApiTestStudie');
            expect(qi.user_id).to.equal('qtest-proband1');
            expect(qi.sort_order).to.equal(2);
            expect(
              qi.date_of_issue.getTime() -
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
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

            expect(addedQI[i]?.date_of_issue.getDay()).to.equal(dateNo);
            expect(addedQI[i]?.study_id).to.equal('ApiTestStudie');
            expect(addedQI[i]?.user_id).to.equal('qtest-proband1');
            expect(addedQI[i]?.date_of_issue.toISOString()).to.equal(
              expectedDate
            );
          }

          expect(
            addedQI
              .map((qi: QuestionnaireInstance) => qi.sort_order)
              .every((v) => v === 5)
          ).to.be.true;
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(7);
          for (let i = 0; i < addedQI.length; i++) {
            expect(addedQI[i]?.study_id).to.equal('ApiTestStudie');
            expect(addedQI[i]?.user_id).to.equal('qtest-proband1');
            expect(addedQI[i]?.date_of_issue.toISOString()).to.equal(
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

          expect(
            addedQI
              .map((qi: QuestionnaireInstance) => qi.sort_order)
              .every((v) => v === 5)
          ).to.be.true;
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
          );

          expect(addedQI.length).to.equal(7);

          const dateNo = 0;

          for (let i = 0; i < addedQI.length; i++) {
            expect(addedQI[i]?.date_of_issue.getDay()).to.equal(dateNo);
            expect(addedQI[i]?.study_id).to.equal('ApiTestStudie');
            expect(addedQI[i]?.user_id).to.equal('qtest-proband1');
            expect(addedQI[i]?.date_of_issue.toISOString()).to.equal(
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
          expect(
            addedQI
              .map((qi: QuestionnaireInstance) => qi.sort_order)
              .every((v) => v === 5)
          ).to.be.true;
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
          const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: 99999 }
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
            expect(addedQI[i]?.study_id).to.equal('ApiTestStudie');
            expect(addedQI[i]?.user_id).to.equal('qtest-proband1');
            expect(addedQI[i]?.date_of_issue.toISOString()).to.equal(
              localTimeToUtc(expectedDate).toISOString()
            );
          }
          expect(
            addedQI
              .map((qi: QuestionnaireInstance) => qi.sort_order)
              .every((v) => v === 5)
          ).to.be.true;
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        const dateOfIssue = addedQI[0]!.date_of_issue;
        const expectedDateOfIssue = localTimeToUtc(
          addHours(startOfToday(), defaultNotificationTimeHour)
        );

        expect(addedQI.length).to.equal(1);
        expect(dateOfIssue.getTime() - expectedDateOfIssue.getTime()).to.equal(
          0,
          `date_of_issue is ${dateOfIssue.toISOString()} but should be ${expectedDateOfIssue.toISOString()}`
        );
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[0]?.cycle).to.equal(1);

        const messages = await getCreatedMessagesForId(99999);
        expect(messages.length).to.equal(1);

        const expectedMessage: Partial<QuestionnaireInstanceCreatedMessage> = {
          id: addedQI[0]!.id,
          studyName: 'ApiTestStudie',
          pseudonym: 'qtest-proband1',
          status: 'active',
          questionnaire: {
            id: 99999,
            customName: 'TestQuestionnaireCustomName',
          },
        };
        expect(messages[0]).to.deep.equal(expectedMessage);
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

        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(11);

        await dbWait(
          'UPDATE questionnaires SET compliance_needed=true WHERE id=${qId}',
          { qId: 99999 }
        );
        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(0);
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

        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(0);

        await dbWait(
          'UPDATE questionnaires SET compliance_needed=false WHERE id=${qId}',
          { qId: 99999 }
        );
        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(11);
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

        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(22);
        expect(await getCreatedMessagesForId(99999)).to.have.length(22);
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(0);
        expect(await getCreatedMessagesForId(99999)).to.have.length(0);
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
        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(0);
        expect(await getCreatedMessagesForId(99999)).to.have.length(0);
      });
    });

    context('questionnaires with conditions', () => {
      it('should only create 1 questionnaire instance when adding a questionnaire with condition_type=internal_last', async function () {
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        expect(addedQI.length).to.equal(1);
        expect(
          addedQI[0]!.date_of_issue.getTime() -
            localTimeToUtc(
              addHours(startOfToday(), defaultNotificationTimeHour)
            ).getTime()
        ).to.equal(0);
        expect(addedQI[0]?.study_id).to.equal('ApiTestStudie');
        expect(addedQI[0]?.user_id).to.equal('qtest-proband1');
        expect(addedQI[0]?.sort_order).to.equal(7);
      });

      it('should not create any questionnaire instances when adding a questionnaire with condition_type=external that has no answer', async function () {
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

      it('should not create questionnaire instances when adding a questionnaire with condition_type=external that is not met', async function () {
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

      it('should create questionnaire instances when adding a questionnaire with condition_type=external that is met', async function () {
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        expect(addedQI.length).to.equal(11);
        expect(
          addedQI
            .map((qi: QuestionnaireInstance) => qi.sort_order)
            .every((v) => v === 7)
        ).to.be.true;
      });

      it('should create questionnaire instances when updating a questionnaire and deleting the condition that was not met', async function () {
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
          condition_value: 'Nein',
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(6);
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
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

        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(6);
        expect(
          addedQI
            .map((qi: QuestionnaireInstance) => qi.sort_order)
            .every((v) => v === 7)
        ).to.be.true;
      });

      it('should delete questionnaire instances when updating a questionnaire and adding a condition that is not met', async function () {
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
          condition_questionnaire_version: 1,
          condition_operand: '==',
          condition_value: 'Nein',
          condition_target_questionnaire: externalQuestionnaire.id,
          condition_target_questionnaire_version: 1,
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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
        ]);

        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );
        expect(addedQI.length).to.equal(11);

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
            arg: condition,
          },
        ]);

        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(0);
      });

      it('should not create questionnaire instances when updating a questionnaire and keeping the condition that was not met', async function () {
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
          condition_value: 'Nein',
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(0);
      });

      it('should delete questionnaire instances and create 1 new one when updating a questionnaire and changing the condition to internal_last', async function () {
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
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

        let addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(11);

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

        addedQI = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 99999 }
        );

        expect(addedQI.length).to.equal(1);
      });

      it('should not create any instances of a deactivated questionnaire when a conditional questionnaire was answered', async function () {
        // Arrange
        await db.none(
          'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          }
        );

        // create external questionnaire
        await txWait([
          {
            query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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
        ]);

        const addedExternalQuestionnaireQIs: QuestionnaireInstance[] =
          await db.manyOrNone(
            'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
            { qId: dailyQuestionnaireForProbands.id }
          );

        // create deactivated questionnaire with external condition
        const deactivatedQuestionnaire: Partial<Questionnaire> = {
          id: 123456,
          study_id: 'ApiTestStudie',
          name: 'TestDeactivatedQuestionnaire',
          active: false,
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 5,
          notification_tries: 0,
          notification_title: '',
          notification_body_new: '',
          notification_body_in_progress: '',
          created_at: addDays(startOfToday(), -100),
        };

        const deactivatedQuestionnaireQuestion = {
          id: 123456,
          questionnaire_id: 123456,
          text: 'I never have to be answered',
          position: 1,
          is_mandatory: false,
        };

        const deactivatedQuestionnaireAnswerOption = {
          id: 123456,
          question_id: 123456,
          text: 'Beispielunterfrage',
          answer_type_id: 1,
          values: [{ value: 'Ja' }, { value: 'Nein' }],
          position: 1,
        };

        const deactivatedQuestionnaireCondition = {
          condition_type: 'external',
          condition_questionnaire_id: deactivatedQuestionnaire.id,
          condition_questionnaire_version: 1,
          condition_operand: '==',
          condition_value: 'Ja',
          condition_target_questionnaire: dailyQuestionnaireForProbands.id,
          condition_target_questionnaire_version: 1,
          condition_target_answer_option: dailyQuestionnaireAnswerOption.id,
        };

        await txWait([
          {
            query: getQuestionnaireInsertQuery(deactivatedQuestionnaire),
            arg: deactivatedQuestionnaire,
          },
          {
            query:
              'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
            arg: deactivatedQuestionnaireQuestion,
          },
          {
            query:
              'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
            arg: deactivatedQuestionnaireAnswerOption,
          },
          {
            query:
              'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
            arg: deactivatedQuestionnaireCondition,
          },
        ]);

        // Act
        // Answer and release external questionnaire
        const externalAnswer = {
          questionnaire_instance_id: addedExternalQuestionnaireQIs[0]!.id,
          question_id: dailyQuestionnaireQuestion.id,
          answer_option_id: dailyQuestionnaireAnswerOption.id,
          value: 'Ja',
        };

        await db.none(
          'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          externalAnswer
        );
        await dbWait(
          'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          {
            status: 'released_once',
            date: new Date(),
            id: addedExternalQuestionnaireQIs[0]!.id,
          }
        );

        // Assert
        const addedDeactivatedQuestionnaireQIsResult = await db.manyOrNone(
          'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
          { qId: 123456 }
        );
        expect(addedDeactivatedQuestionnaireQIsResult).to.have.length(0);
      });
    });
  });

  describe('Autocreate/delete questionnaire instances on questionnaire instance status update for conditional questionnaires', () => {
    it('should not create any instances when inserting answers that dont meet external condition', async function () {
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
        condition_value: 'Nein',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          arg: {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          },
        },
        {
          query: getQuestionnaireInsertQuery(externalQuestionnaire),
          arg: externalQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: externalQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: externalAnswerOption,
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

      const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
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
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer,
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
      expect(await getCreatedMessagesForId(99999)).to.have.length(0);
    });

    it('should create instances when inserting answers that meet external condition', async function () {
      const dayQuestionnaire2: Partial<Questionnaire> = {
        id: 99999,
        study_id: 'ApiTestStudie',
        name: 'TestQuestionnaire',
        custom_name: 'CustomName',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        notification_weekday: null,
        notification_interval: null,
        notification_interval_unit: null,
        created_at: addDays(startOfToday(), -100),
      };

      const dayQuestion2 = {
        id: 99999,
        questionnaire_id: 99999,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const dayAnswerOption2 = {
        id: 99999,
        question_id: 99999,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const externalQuestionnaire: Partial<Questionnaire> = {
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
        condition_questionnaire_id: dayQuestionnaire2.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          arg: {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          },
        },
        {
          query: getQuestionnaireInsertQuery(externalQuestionnaire),
          arg: externalQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: externalQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: externalAnswerOption,
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(dayQuestionnaire2),
          arg: dayQuestionnaire2,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion2,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption2,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
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
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer,
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(8);

      expect((await getCreatedMessagesForId(99999)).length).to.equal(8);
    });

    it('should create instances when updating answer that was not met before and setting instance to released_twice', async function () {
      const externalQuestionnaire: Partial<Questionnaire> = {
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
          query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

      const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer1 = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Nein',
      };

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer1,
        },
      ]);

      let addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
      expect((await getCreatedMessagesForId(99999)).length).to.equal(0);

      const externalAnswer2 = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
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
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value, versioning) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value}, ${versioning})',
          arg: externalAnswer2,
        },
      ]);

      addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(11);
      expect((await getCreatedMessagesForId(99999)).length).to.equal(11);
    });

    it('should not create additional instances when updating answer that was met before and setting instance to released_twice', async function () {
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
          query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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

      const addedExternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );

      const externalAnswer1 = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
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
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer1,
        },
      ]);

      let addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(11);
      expect((await getCreatedMessagesForId(99999)).length).to.equal(11);

      const externalAnswer2 = {
        questionnaire_instance_id: addedExternalQI[0]!.id,
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
            id: addedExternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value, versioning) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value}, ${versioning})',
          arg: externalAnswer2,
        },
      ]);

      addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(11);
      expect(await getCreatedMessagesForId(99999)).to.have.length(11);
    });

    it('should not create more instances when inserting answer that does not meet internal_last condition', async function () {
      const condition_internal = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dailyQuestionnaireForProbands.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dailyQuestionnaireForProbands.id,
        condition_target_answer_option: dailyQuestionnaireAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          arg: {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          },
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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
          arg: condition_internal,
        },
      ]);

      const addedInternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      const internalAnswer = {
        questionnaire_instance_id: addedInternalQI[0]!.id,
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
            id: addedInternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
    });

    it('should create one more instance when inserting answer that does meet internal_last condition', async function () {
      const expectedDateOfIssue = localTimeToUtc(
        addHours(addDays(startOfToday(), 2), defaultNotificationTimeHour)
      );
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

      await txWait([
        {
          query: getQuestionnaireInsertQuery(dailyQuestionnaireForProbands),
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
          arg: condition_internal,
        },
      ]);

      const addedInternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      const internalAnswer = {
        questionnaire_instance_id: addedInternalQI[0]!.id,
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
            id: addedInternalQI[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);

      const dateOfIssue = addedQI[1]!.date_of_issue;
      expect(dateOfIssue.getTime()).to.equal(
        expectedDateOfIssue.getTime(),
        `date_of_issue is ${dateOfIssue.toISOString()} but should be ${expectedDateOfIssue.toISOString()}`
      );
    });

    it('should create 3 more instances when inserting 3 answers that do meet internal_last condition for hourly questionnaire', async function () {
      const hour5Questionnaire = createQuestionnaire({
        cycle_amount: 5,
        cycle_unit: 'hour',
        cycle_per_day: 3,
        cycle_first_hour: 3,
        activate_after_days: 5,
        deactivate_after_days: 10,
      });
      const hour5Question = {
        id: 99999,
        questionnaire_id: 99999,
        questionnaire_version: 1,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };
      const hour5AnswerOption = {
        id: 99999,
        question_id: 99999,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };
      const condition_internal = {
        condition_type: 'internal_last',
        condition_questionnaire_id: hour5Questionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: hour5Questionnaire.id,
        condition_target_answer_option: hour5Questionnaire.id,
      };

      await txWait([
        {
          query:
            'UPDATE probands SET first_logged_in_at=$(date) WHERE pseudonym=$(pseudonym)',
          arg: {
            date: subDays(new Date(), 5),
            pseudonym: 'qtest-proband1',
          },
        },
      ]);

      await txWait([
        {
          query: getQuestionnaireInsertQuery(hour5Questionnaire),
          arg: hour5Questionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: hour5Question,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: hour5AnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition_internal,
        },
      ]);

      // First instance and answer
      const addedInternalQI1: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI1.length).to.equal(1);
      const internalAnswer1 = {
        questionnaire_instance_id: addedInternalQI1[0]!.id,
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
            id: addedInternalQI1[0]!.id,
          },
        },

        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer1,
        },
      ]);

      // Second instance and answer
      const addedInternalQI2: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} AND cycle=${cycle}',
        {
          qId: 99999,
          cycle: 2,
        }
      );
      expect(addedInternalQI2.length).to.equal(1);
      const internalAnswer2 = {
        questionnaire_instance_id: addedInternalQI2[0]!.id,
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
            id: addedInternalQI2[0]!.id,
          },
        },

        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer2,
        },
      ]);

      // Third instance and answer
      const addedInternalQI3: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} AND cycle=${cycle}',
        {
          qId: 99999,
          cycle: 3,
        }
      );
      expect(addedInternalQI3.length).to.equal(1);
      const internalAnswer3 = {
        questionnaire_instance_id: addedInternalQI3[0]!.id,
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
            id: addedInternalQI3[0]!.id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer3,
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
        { qId: 99999 }
      );

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
      // should be on the next day because of cycle_per_day
      expect(
        addedQI[3]!.date_of_issue.getTime() -
          localTimeToUtc(addHours(addDays(startOfToday(), 1), 3)).getTime()
      ).to.equal(0);
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

      const addedInternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      expect((await getCreatedMessagesForId(99999)).length).to.equal(1);

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date}, date_of_issue=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: localTimeToUtc(startOfToday()),
            id: addedInternalQI[0]!.id,
          },
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);
      expect(
        addedQI[0]!.date_of_issue.getTime() -
          localTimeToUtc(startOfToday()).getTime()
      ).to.equal(0);
      expect(
        addedQI[1]!.date_of_issue.getTime() -
          localTimeToUtc(startOfToday()).getTime()
      ).to.equal(0);

      expect((await getCreatedMessagesForId(99999, 2)).length).to.equal(2);
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

      const addedInternalQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: new Date(),
            id: addedInternalQI[0]!.id,
          },
        },
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v2=${date} WHERE id=${id}',
          arg: {
            status: 'released_twice',
            date: new Date(),
            id: addedInternalQI[0]!.id,
          },
        },
      ]);

      const addedQI: QuestionnaireInstance[] = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);
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
            id: 88881,
          },
          {
            ...firstQuestionnaire,
            answerOptions: [firstQuestionnaire.answerOptions[0]!],
          }
        );

      const thirdQuestionnaire =
        await insertQuestionnairesWithQuestionsAndConditions(
          {
            ...questionnaireTemplate,
            id: 88882,
          },
          {
            ...firstQuestionnaire,
            answerOptions: [firstQuestionnaire.answerOptions[1]!],
          }
        );

      const fourthQuestionnaire =
        await insertQuestionnairesWithQuestionsAndConditions(
          {
            ...questionnaireTemplate,
            id: 88883,
          },
          {
            ...secondQuestionnaire,
            answerOptions: [secondQuestionnaire.answerOptions[0]!],
          }
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

      await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [thirdQuestionnaire.questionnaire.id, 1]
      );
      await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [fourthQuestionnaire.questionnaire.id, 1]
      );
      const queuedInstances = await db.manyOrNone(
        "SELECT * FROM questionnaire_instances_queued WHERE user_id='qtest-proband1'"
      );
      expect(queuedInstances.length).to.equal(3);
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
          query: getQuestionnaireInsertQuery(firstQuestionnaire),
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
          query: getQuestionnaireInsertQuery(secondQuestionnaire),
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
          query: getQuestionnaireInsertQuery(thirdQuestionnaire),
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
          query: getQuestionnaireInsertQuery(fourthQuestionnaire),
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

      const thirdQi: QuestionnaireInstance | null = await db.oneOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [thirdQuestionnaire.id, 1]
      );
      const fourthQi: QuestionnaireInstance | null = await db.oneOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [fourthQuestionnaire.id, 1]
      );
      expect(thirdQi).to.be.null;
      expect(fourthQi).to.be.null;

      const queues = await db.manyOrNone(
        "SELECT * FROM questionnaire_instances_queued WHERE user_id='qtest-proband1'"
      );
      expect(queues.length).to.equal(0);

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

  async function deleteParticipant(pseudonym: string): Promise<void> {
    await db.none('DELETE FROM probands WHERE pseudonym = $1', pseudonym);
  }

  function getInsertQuery(table: string, object: object): string {
    const fieldNames = Object.keys(object);
    const fields = fieldNames.join(', ');
    const values = fieldNames.map((key) => `$\{${key}}`).join(', ');
    return `INSERT INTO ${table} (${fields}) VALUES (${values});`;
  }

  function getQuestionnaireInsertQuery(
    questionnaire: Partial<Questionnaire>
  ): string {
    return getInsertQuery('questionnaires', questionnaire);
  }

  async function insertQuestionnaire(
    overwrites: Partial<Questionnaire> = {}
  ): Promise<void> {
    const questionnaire = createQuestionnaire(overwrites);

    await dbWait(getQuestionnaireInsertQuery(questionnaire), questionnaire);
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

  async function getCreatedMessagesForId(
    qId: number,
    messageCountThreshold = 1
  ): Promise<QuestionnaireInstanceCreatedMessage[]> {
    await waitForConditionToBeTrue(
      () => messageHistory.length >= messageCountThreshold
    );
    return messageHistory.filter((msg) => msg.questionnaire.id === qId);
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
        query: getQuestionnaireInsertQuery(questionnaire),
        arg: questionnaire,
      },
      {
        query: getInsertQuery('questions', question),
        arg: question,
      },
      ...answerOptions.map((answerOption) => ({
        query: getInsertQuery('answer_options', answerOption),
        arg: answerOption,
      })),
      ...(condition
        ? [
            {
              query: getInsertQuery('conditions', condition),
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
});

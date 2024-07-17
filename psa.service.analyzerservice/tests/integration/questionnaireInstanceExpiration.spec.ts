/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox } from 'sinon';
import { Server } from '../../src/server';
import {
  MessageQueueTopic,
  MessageQueueClient,
  QuestionnaireInstanceExpiredMessage,
} from '@pia/lib-messagequeue';
import { config } from '../../src/config';
import { Questionnaire } from '../../src/models/questionnaire';
import { format, startOfToday, subDays } from 'date-fns';
import { Proband } from '../../src/models/proband';
import { db } from '../../src/db';
import {
  QuestionnaireInstance,
  QuestionnaireInstanceStatus,
} from '../../src/models/questionnaireInstance';
import { QuestionnaireInstancesService } from '../../src/services/questionnaireInstancesService';
import { expect } from 'chai';
import { waitForConditionToBeTrue } from './helper';

describe('Questionnaire Instance Expiration', () => {
  const testSandbox = createSandbox();
  const mqc = new MessageQueueClient({
    ...config.servers.messageQueue,
    serviceName: 'test',
  });

  const messageHistory: QuestionnaireInstanceExpiredMessage[] = [];

  before(async () => {
    await db.none(
      'ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255) DEFAULT NULL'
    );

    await Server.init();
    await mqc.connect(true);

    await mqc.createConsumer(
      MessageQueueTopic.QUESTIONNAIRE_INSTANCE_EXPIRED,
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
    await db.none('INSERT INTO studies (name) VALUES ($1)', ['TestStudy']);
  });

  afterEach(async () => {
    await db.none('DELETE FROM questionnaire_instances');
    await db.none('DELETE FROM questionnaires');
    await db.none('DELETE FROM probands');
    await db.none('DELETE FROM studies');

    messageHistory.length = 0;
    testSandbox.restore();
  });

  const statusToExpire: QuestionnaireInstanceStatus[] = [
    'inactive',
    'active',
    'in_progress',
  ];

  for (const status of statusToExpire) {
    it(`should expire when date of issue exceeded expiration date and status is ${status}`, async () => {
      await insertQuestionnaire({
        expires_after_days: 1,
        type: 'for_probands',
        cycle_unit: 'once',
      });
      await insertParticipant();
      await insertQuestionnaireInstance({
        status,
        date_of_issue: subDays(startOfToday(), 3),
      });

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      const questionnaireInstance = await db.oneOrNone<QuestionnaireInstance>(
        'SELECT * FROM questionnaire_instances WHERE id = 1'
      );
      expect(questionnaireInstance?.status).to.equal('expired');

      await waitForConditionToBeTrue(() => messageHistory.length > 0);

      expect(messageHistory).to.deep.equal([
        {
          id: 1,
          studyName: 'TestStudy',
          pseudonym: 'participant-1',
          status: 'expired',
          questionnaire: {
            id: 1,
            customName: 'TestQuestionnaireCustomName',
          },
        },
      ]);
    });
  }

  const statusToNeverExpire: QuestionnaireInstanceStatus[] = [
    'expired',
    'deleted',
    'released_once',
    'released_twice',
    'released',
  ];

  for (const status of statusToNeverExpire) {
    it(`should not expire when status is ${status}`, async () => {
      await insertQuestionnaire({
        expires_after_days: 1,
        type: 'for_probands',
        cycle_unit: 'once',
      });
      await insertParticipant();
      await insertQuestionnaireInstance({
        status,
        date_of_issue: subDays(startOfToday(), 3),
      });

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      const questionnaireInstance = await db.oneOrNone<QuestionnaireInstance>(
        'SELECT * FROM questionnaire_instances WHERE id = 1'
      );
      expect(questionnaireInstance?.status).to.equal(status);

      await waitForConditionToBeTrue(() => messageHistory.length > 0);

      expect(messageHistory).to.deep.equal([]);
    });
  }

  it(`should not expire when cycle unit is spontan`, async () => {
    await insertQuestionnaire({
      expires_after_days: 1,
      type: 'for_probands',
      cycle_unit: 'spontan',
    });
    await insertParticipant();
    await insertQuestionnaireInstance({
      status: 'in_progress',
      date_of_issue: subDays(startOfToday(), 3),
    });

    await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

    const questionnaireInstance = await db.oneOrNone<QuestionnaireInstance>(
      'SELECT * FROM questionnaire_instances WHERE id = 1'
    );
    expect(questionnaireInstance?.status).to.equal('in_progress');

    await waitForConditionToBeTrue(() => messageHistory.length > 0);

    expect(messageHistory).to.deep.equal([]);
  });

  it(`should not expire when questionnaire type is not for_probands`, async () => {
    await insertQuestionnaire({
      expires_after_days: 1,
      type: 'for_research_team',
      cycle_unit: 'once',
    });
    await insertParticipant();
    await insertQuestionnaireInstance({
      status: 'in_progress',
      date_of_issue: subDays(startOfToday(), 3),
    });

    await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

    const questionnaireInstance = await db.oneOrNone<QuestionnaireInstance>(
      'SELECT * FROM questionnaire_instances WHERE id = 1'
    );
    expect(questionnaireInstance?.status).to.equal('in_progress');

    await waitForConditionToBeTrue(() => messageHistory.length > 0);

    expect(messageHistory).to.deep.equal([]);
  });

  async function insertParticipant(
    participant: Partial<
      Pick<Proband, 'pseudonym' | 'status' | 'study' | 'first_logged_in_at'>
    > = {}
  ): Promise<void> {
    await db.none(
      'INSERT INTO probands (pseudonym, status, study, first_logged_in_at) VALUES ($(pseudonym), $(status), $(study), $(first_logged_in_at))',
      {
        pseudonym: 'participant-1',
        status: 'active',
        study: 'TestStudy',
        first_logged_in_at: null,
        ...participant,
      }
    );
  }

  function createQuestionnaireInstance(
    overwrites: Partial<QuestionnaireInstance>
  ): Partial<QuestionnaireInstance> {
    return {
      id: 1,
      study_id: 'TestStudy',
      questionnaire_id: 1,
      questionnaire_version: 1,
      questionnaire_name: 'TestQuestionnaire',
      user_id: 'participant-1',
      date_of_issue: startOfToday(),
      cycle: 1,
      status: 'inactive',
      release_version: 0,
      ...overwrites,
    };
  }

  async function insertQuestionnaireInstance(
    overwrites: Partial<QuestionnaireInstance> = {}
  ): Promise<void> {
    await db.none(
      'INSERT INTO questionnaire_instances ' +
        '(id, study_id, questionnaire_id, questionnaire_name, questionnaire_version, user_id, date_of_issue, cycle, status, release_version) VALUES' +
        '(${id}, ${study_id}, ${questionnaire_id}, ${questionnaire_name}, ${questionnaire_version}, ${user_id}, ${date_of_issue}, ${cycle}, ${status}, ${release_version})',
      createQuestionnaireInstance(overwrites)
    );
  }

  async function insertQuestionnaire(
    overwrites: Partial<Questionnaire> = {}
  ): Promise<void> {
    await db.none(
      'INSERT INTO questionnaires' +
        '(id, study_id, name, custom_name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, expires_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, type, created_at) VALUES (${id}, ${study_id}, ${name}, ${custom_name},${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${expires_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${type}, ${created_at})',
      createQuestionnaire(overwrites)
    );
  }

  function createQuestionnaire(
    overwrites: Partial<Questionnaire> = {}
  ): Partial<Questionnaire> {
    return {
      id: 1,
      version: 1,
      study_id: 'TestStudy',
      name: 'TestQuestionnaire',
      custom_name: 'TestQuestionnaireCustomName',
      type: 'for_probands',
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
      expires_after_days: 10,
      activate_at_date: format(startOfToday(), 'yyyy.MM.dd'),
      created_at: subDays(startOfToday(), 2),
      ...overwrites,
    };
  }
});

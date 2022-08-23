/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import pg_promise from 'pg-promise';

import { Server } from '../../src/server';
import { db } from '../../src/db';

import {
  setup,
  cleanup,
} from './spontaneousQuestionnaires.spec.data/setup.helper';
import { dbWait } from './helper';
import { QuestionnaireInstance } from '../../src/models/questionnaireInstance';

const pgp = pg_promise({ capSQL: true });

describe('Spontaneous questionnaire instance creation', function () {
  const QUESTIONNAIRE_VERSION_1 = 1;
  const QUESTIONNAIRE_VERSION_2 = 2;

  before(async function () {
    await Server.init();
  });

  after(async function () {
    await Server.stop();
  });

  beforeEach(async function () {
    await setup();
  });

  afterEach(async function () {
    await cleanup();
  });

  describe('versioning a spontaneous questionnaire', () => {
    it('should replace all questionnaire instances of an old version if not answered', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCount = 2;

      await createQuestionnaire({ version: 1 });
      const addedQIs: QuestionnaireInstance[] = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );

      expect(addedQIs.length).to.equal(expectedQuestionnaireInstanceCount);
      expect(addedQIs[0]?.questionnaire_version).to.equal(
        QUESTIONNAIRE_VERSION_1
      );
      expect(addedQIs[1]?.questionnaire_version).to.equal(
        QUESTIONNAIRE_VERSION_1
      );

      // Act
      await createQuestionnaire({ version: 2 });

      // Assert
      const replacedQIs: QuestionnaireInstance[] = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(expectedQuestionnaireInstanceCount);
      expect(replacedQIs[0]?.questionnaire_version).to.equal(
        QUESTIONNAIRE_VERSION_2
      );
      expect(replacedQIs[1]?.questionnaire_version).to.equal(
        QUESTIONNAIRE_VERSION_2
      );
    });

    it('should generate a new questionnaire instance if one is answered', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCountBefore = 2;
      const expectedQuestionnaireInstanceCountAfter = 3;
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(
        expectedQuestionnaireInstanceCountBefore
      );

      // Act
      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='qtest-proband1'"
      );

      // Assert
      const withNewQI = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(
        expectedQuestionnaireInstanceCountAfter
      );
    });

    it('should generate a new questionnaire even of a newer version instance if one is answered', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCountBefore = 2;
      const expectedQuestionnaireInstanceCountAfter = 3;

      // Act
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(
        expectedQuestionnaireInstanceCountBefore
      );

      await createQuestionnaire({ version: 2 });
      const replacedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(
        expectedQuestionnaireInstanceCountBefore
      );

      // Act
      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='qtest-proband1'"
      );

      // Assert
      const withNewQI: QuestionnaireInstance[] = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(
        expectedQuestionnaireInstanceCountAfter
      );
      const q1_1 = withNewQI.find(
        (qi) =>
          qi.user_id === 'qtest-proband1' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_2 &&
          qi.cycle === 1
      );
      const q1_2 = withNewQI.find(
        (qi) =>
          qi.user_id === 'qtest-proband1' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_2 &&
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          qi.cycle === 2
      );
      const q2_1 = withNewQI.find(
        (qi) =>
          qi.user_id === 'qtest-proband2' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_2 &&
          qi.cycle === 1
      );
      expect(q1_1?.status).to.equal('released_once');
      expect(q1_2?.status).to.equal('active');
      expect(q2_1?.status).to.equal('active');
    });

    it('should replace all questionnaire instances of an old version but keep the answered', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCountBefore = 2;
      const expectedQuestionnaireInstanceCountAfter = 3;

      // Act
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(
        expectedQuestionnaireInstanceCountBefore
      );

      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='qtest-proband1'"
      );
      const withNewQI = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(
        expectedQuestionnaireInstanceCountAfter
      );
      await createQuestionnaire({ version: 2 });

      // Assert
      const replacedQIs: QuestionnaireInstance[] = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(
        expectedQuestionnaireInstanceCountAfter
      );
      const q1_1 = replacedQIs.find(
        (qi) =>
          qi.user_id === 'qtest-proband1' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_1
      );
      const q1_2 = replacedQIs.find(
        (qi) =>
          qi.user_id === 'qtest-proband1' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_2
      );
      const q2_1 = replacedQIs.find(
        (qi) =>
          qi.user_id === 'qtest-proband2' &&
          qi.questionnaire_version === QUESTIONNAIRE_VERSION_2
      );
      expect(q1_1?.status).to.equal('released_once');
      expect(q1_2?.status).to.equal('active');
      expect(q2_1?.status).to.equal('active');
    });
  });

  const questionnaireCs = new pgp.helpers.ColumnSet(
    [
      'id',
      'version',
      'study_id',
      'name',
      'no_questions',
      'cycle_amount',
      'cycle_unit',
      'activate_after_days',
      'deactivate_after_days',
      'notification_tries',
      'notification_title',
      'notification_body_new',
      'notification_body_in_progress',
      'notification_weekday',
      'notification_interval',
      'notification_interval_unit',
      'created_at',
    ],
    { table: 'questionnaires' }
  );

  async function createQuestionnaire(options = {}): Promise<void> {
    const spontaneous = {
      id: 99999,
      version: 1,
      study_id: 'ApiTestStudie',
      name: 'Test spontaneous Questionnaire',
      no_questions: 1,
      cycle_amount: null,
      cycle_unit: 'spontan',
      activate_after_days: 0,
      deactivate_after_days: 5,
      notification_tries: 3,
      notification_title: '',
      notification_body_new: '',
      notification_body_in_progress: '',
      notification_weekday: null,
      notification_interval: null,
      notification_interval_unit: null,
      created_at: new Date(),
    };
    Object.assign(spontaneous, options);
    const query = pgp.helpers.insert(spontaneous, questionnaireCs);
    await dbWait(query);
  }
});

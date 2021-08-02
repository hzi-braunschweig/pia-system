/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { expect } = require('chai');
const pgp = require('pg-promise')({ capSQL: true });

const { Server } = require('../../src/server');

const { db } = require('../../src/db');
const {
  setup,
  cleanup,
} = require('./spontaneousQuestionnaires.spec.data/setup.helper');

const { dbWait } = require('./helper');

describe('Spontaneous questionnaire instance creation', function () {
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
      await createQuestionnaire({ version: 1 });
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(2);
      expect(addedQIs[0].questionnaire_version).to.equal(1);
      expect(addedQIs[1].questionnaire_version).to.equal(1);

      await createQuestionnaire({ version: 2 });
      const replacedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(2);
      expect(replacedQIs[0].questionnaire_version).to.equal(2);
      expect(replacedQIs[1].questionnaire_version).to.equal(2);
    });

    it('should generate a new questionnaire instance if one is answered', async function () {
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(2);

      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='QTestProband1'"
      );

      const withNewQI = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(3);
    });

    it('should generate a new questionnaire even of a newer version instance if one is answered', async function () {
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(2);

      await createQuestionnaire({ version: 2 });
      const replacedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(2);

      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='QTestProband1'"
      );
      const withNewQI = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(3);
      const q1_1 = withNewQI.find(
        (qi) =>
          qi.user_id === 'QTestProband1' &&
          qi.questionnaire_version === 2 &&
          qi.cycle === 1
      );
      const q1_2 = withNewQI.find(
        (qi) =>
          qi.user_id === 'QTestProband1' &&
          qi.questionnaire_version === 2 &&
          qi.cycle === 2
      );
      const q2_1 = withNewQI.find(
        (qi) =>
          qi.user_id === 'QTestProband2' &&
          qi.questionnaire_version === 2 &&
          qi.cycle === 1
      );
      expect(q1_1.status).to.equal('released_once');
      expect(q1_2.status).to.equal('active');
      expect(q2_1.status).to.equal('active');
    });

    it('should replace all questionnaire instances of an old version but keep the answered', async function () {
      await createQuestionnaire();
      const addedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(addedQIs.length).to.equal(2);

      await dbWait(
        "UPDATE questionnaire_instances SET status='released_once', date_of_release_v1=NOW() WHERE questionnaire_id=99999 AND user_id='QTestProband1'"
      );
      const withNewQI = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(withNewQI.length).to.equal(3);

      await createQuestionnaire({ version: 2 });
      const replacedQIs = await db.many(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id = 99999'
      );
      expect(replacedQIs.length).to.equal(3);
      const q1_1 = replacedQIs.find(
        (qi) => qi.user_id === 'QTestProband1' && qi.questionnaire_version === 1
      );
      const q1_2 = replacedQIs.find(
        (qi) => qi.user_id === 'QTestProband1' && qi.questionnaire_version === 2
      );
      const q2_1 = replacedQIs.find(
        (qi) => qi.user_id === 'QTestProband2' && qi.questionnaire_version === 2
      );
      expect(q1_1.status).to.equal('released_once');
      expect(q1_2.status).to.equal('active');
      expect(q2_1.status).to.equal('active');
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

  async function createQuestionnaire(options = {}) {
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

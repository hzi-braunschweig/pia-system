/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { expect } = require('chai');
const df = require('date-fns');

const { Server } = require('../../src/server');

const { db } = require('../../src/db');
const {
  setup,
  cleanup,
} = require('./questionnaireInstanceCreation.spec.data/setup.helper');
const { dbWait, txWait } = require('./helper');

const onceQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
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
  notification_interval: null,
  notification_interval_unit: null,
  activate_at_date: df.format(df.startOfToday(), 'yyyy.MM.dd'),
  created_at: df.addDays(df.startOfToday(), -100),
};

const dateQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 0,
  cycle_unit: 'date',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  activate_at_date: df.format(df.startOfToday(), 'yyyy.MM.dd'),
  created_at: df.addDays(df.startOfToday(), -100),
};

const hour12Questionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 12,
  cycle_unit: 'hour',
  cycle_per_day: 3,
  cycle_first_hour: 3,
  activate_after_days: 5,
  deactivate_after_days: 10,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const hour5Questionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 5,
  cycle_unit: 'hour',
  cycle_per_day: 3,
  cycle_first_hour: 3,
  activate_after_days: 5,
  deactivate_after_days: 10,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

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

const hour1Questionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 1,
  cycle_unit: 'hour',
  cycle_per_day: 3,
  cycle_first_hour: 3,
  activate_after_days: 5,
  deactivate_after_days: 10,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const dayQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'day',
  activate_after_days: 5,
  deactivate_after_days: 20,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const dayQuestion = {
  id: 99999,
  questionnaire_id: 99999,
  questionnaire_version: 1,
  text: 'Beispielfrage',
  position: 1,
  is_mandatory: false,
};

const dayAnswerOption = {
  id: 99999,
  question_id: 99999,
  text: 'Beispielunterfrage',
  answer_type_id: 1,
  values: [{ value: 'Ja' }, { value: 'Nein' }],
  position: 1,
};

const weekQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'week',
  activate_after_days: 5,
  deactivate_after_days: 100,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const monthQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'month',
  activate_after_days: 5,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -500),
};

const monthQuestionnaire2 = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'month',
  activate_after_days: 5,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: null,
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.startOfToday(),
};

const onceQuestionnaireWithNotificationDay = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 0,
  cycle_unit: 'once',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: 'wednesday',
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const dateQuestionnaireWithNotificationDay = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 0,
  cycle_unit: 'date',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: 'wednesday',
  activate_at_date: df.format(df.startOfToday(), 'yyyy.MM.dd'),
  created_at: df.addDays(df.startOfToday(), -100),
};

const weekQuestionnaireWithNotificationDay = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'week',
  activate_after_days: 5,
  deactivate_after_days: 100,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: 'monday',
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -100),
};

const monthQuestionnaireWithNotificationDay = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'month',
  activate_after_days: 5,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: 'sunday',
  notification_interval: null,
  notification_interval_unit: null,
  created_at: df.addDays(df.startOfToday(), -500),
};

const spontanQuestionnaire = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 0,
  cycle_unit: 'spontan',
  activate_after_days: 0,
  deactivate_after_days: 0,
  notification_tries: 0,
  notification_title: '',
  notification_body_new: '',
  notification_body_in_progress: '',
  notification_weekday: '',
  notification_interval: '',
  notification_interval_unit: 0,
  created_at: df.addDays(df.startOfToday(), -100),
};

const spontanQuestionnaireWithUnusedValues = {
  id: 99999,
  version: 1,
  study_id: 'ApiTestStudie',
  name: 'TestQuestionnaire',
  no_questions: 2,
  cycle_amount: 2,
  cycle_unit: 'spontan',
  activate_after_days: 5,
  deactivate_after_days: 365,
  notification_tries: 3,
  notification_title: 'title',
  notification_body_new: 'new',
  notification_body_in_progress: 'old',
  notification_weekday: 'sunday',
  notification_interval: 'days',
  notification_interval_unit: 2,
  created_at: df.addDays(df.startOfToday(), -100),
};

function nextDayXOfWeek(date, day) {
  const theNextDay = df.setDay(date, day);
  if (date > theNextDay) {
    return df.addWeeks(theNextDay, 1);
  }
  return theNextDay;
}

describe('Questionnaire instance creation', function () {
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

  describe('Autocreate/delete questionnaire instances on questionnaire insert and update and on user update', function () {
    const userSettingsHour = 13;

    it('should not create any instances when no user is active in study and questionnaire is added', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(0);
    });

    it('should not create any instances when user is active in study but no questionnaire was added', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(0);
    });

    it('should create correct one time questionnaire instances when adding a questionnaire', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        onceQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue -
          df.subDays(df.addHours(df.startOfToday(), userSettingsHour), 5)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should create correct one time questionnaire instance and ignore notification day when adding a questionnaire', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${notification_weekday}, ${created_at})',
        onceQuestionnaireWithNotificationDay
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      const dateNo = df.subDays(new Date(), 5).getDay();
      expect(addedQI[0].date_of_issue.getDay()).to.equal(dateNo);

      if (dateNo !== df.subDays(df.startOfToday(), 5).getDay()) {
        expect(
          addedQI[0].date_of_issue -
            df
              .subDays(df.addHours(df.startOfToday(), userSettingsHour), 5)
              .moveToDayOfWeek(dateNo)
        ).to.equal(0);
      } else {
        expect(
          addedQI[0].date_of_issue -
            df.subDays(df.addHours(df.startOfToday(), userSettingsHour), 5)
        ).to.equal(0);
      }

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should create correct questionnaire instances when adding a questionnaire with set date without the user having been logged in before', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, activate_at_date, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${activate_at_date}, ${created_at})',
        dateQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should not create any instances when adding a questionnaire that needs compliance and user has not complied', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date}, compliance_samples=false WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, activate_at_date, compliance_needed, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${activate_at_date}, true, ${created_at})',
        dateQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should create instances when adding a questionnaire that needs compliance and user has complied', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date}, compliance_samples=true WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, activate_at_date, compliance_needed, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${activate_at_date}, true, ${created_at})',
        dateQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should create correct questionnaire instance on correct notification day when adding a questionnaire with set date', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, activate_at_date, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${notification_weekday}, ${activate_at_date}, ${created_at})',
        dateQuestionnaireWithNotificationDay
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(new Date(addedQI[0].date_of_issue).toISOString()).to.equal(
        df.addHours(df.startOfToday(), userSettingsHour).toISOString()
      );

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should create correct hourly questionnaire instances when adding a questionnaire with 12h cycle and disregard users notification settings', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit,cycle_per_day, cycle_first_hour, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${cycle_per_day}, ${cycle_first_hour}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        hour12Questionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(22);

      for (let i = 0; i < addedQI.length; i++) {
        expect(addedQI[i].study_id).to.equal('ApiTestStudie');
        expect(addedQI[i].user_id).to.equal('QTestProband1');
        expect(addedQI[i].date_of_issue.toString()).to.equal(
          df
            .setHours(
              df.addDays(df.startOfToday(), (i - (i % 2)) / 2),
              3 + (i % 2) * 12
            )
            .toString()
        );
      }
    });

    it('should create correct hourly questionnaire instances when adding a questionnaire with 5h cycle and disregard users notification settings', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit,cycle_per_day, cycle_first_hour, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${cycle_per_day}, ${cycle_first_hour}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        hour5Questionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(33);

      expect(
        addedQI[0].date_of_issue - df.addHours(df.startOfToday(), 3)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue - df.addHours(df.startOfToday(), 3 + 5)
      ).to.equal(0);
      expect(
        addedQI[5].date_of_issue -
          df.addHours(df.addDays(df.startOfToday(), 1), 3 + 2 * 5)
      ).to.equal(0);
      expect(
        addedQI[32].date_of_issue -
          df.addHours(df.addDays(df.startOfToday(), 10), 3 + 2 * 5)
      ).to.equal(0);

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[1].study_id).to.equal('ApiTestStudie');
      expect(addedQI[32].study_id).to.equal('ApiTestStudie');

      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[1].user_id).to.equal('QTestProband1');
      expect(addedQI[32].user_id).to.equal('QTestProband1');

      expect(addedQI[0].cycle).to.equal(1);
      expect(addedQI[1].cycle).to.equal(2);
      expect(addedQI[32].cycle).to.equal(33);
    });

    it('should create correct hourly questionnaire instances when adding a questionnaire with 1h cycle and disregard users notification settings', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit,cycle_per_day, cycle_first_hour, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${cycle_per_day}, ${cycle_first_hour}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        hour1Questionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(33);

      expect(
        addedQI[0].date_of_issue - df.addHours(df.startOfToday(), 3)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue - df.addHours(df.startOfToday(), 3 + 1)
      ).to.equal(0);
      expect(
        addedQI[5].date_of_issue -
          df.addHours(df.addDays(df.startOfToday(), 1), 3 + 2)
      ).to.equal(0);
      expect(
        addedQI[32].date_of_issue -
          df.addHours(df.addDays(df.startOfToday(), 10), 3 + 2)
      ).to.equal(0);

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[1].study_id).to.equal('ApiTestStudie');
      expect(addedQI[32].study_id).to.equal('ApiTestStudie');

      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[1].user_id).to.equal('QTestProband1');
      expect(addedQI[32].user_id).to.equal('QTestProband1');

      expect(addedQI[0].cycle).to.equal(1);
      expect(addedQI[1].cycle).to.equal(2);
      expect(addedQI[32].cycle).to.equal(33);
    });

    it('should create correct dayly questionnaire instances when adding a questionnaire', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(11);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue -
          df.addDays(df.addHours(df.startOfToday(), userSettingsHour), 2)
      ).to.equal(0);
      expect(
        addedQI[10].date_of_issue -
          df.addDays(df.addHours(df.startOfToday(), userSettingsHour), 20)
      ).to.equal(0);

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[1].study_id).to.equal('ApiTestStudie');
      expect(addedQI[10].study_id).to.equal('ApiTestStudie');

      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[1].user_id).to.equal('QTestProband1');
      expect(addedQI[10].user_id).to.equal('QTestProband1');

      expect(addedQI[0].cycle).to.equal(1);
      expect(addedQI[1].cycle).to.equal(2);
      expect(addedQI[10].cycle).to.equal(11);
    });

    it('should create correct weekly questionnaire instances when user becomes active in study', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        weekQuestionnaire
      );
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(8);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue -
          df.addWeeks(df.addHours(df.startOfToday(), userSettingsHour), 2)
      ).to.equal(0);
      expect(
        addedQI[7].date_of_issue -
          df.addWeeks(df.addHours(df.startOfToday(), userSettingsHour), 14)
      ).to.equal(0);

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[1].study_id).to.equal('ApiTestStudie');
      expect(addedQI[7].study_id).to.equal('ApiTestStudie');

      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[1].user_id).to.equal('QTestProband1');
      expect(addedQI[7].user_id).to.equal('QTestProband1');
    });

    it('should create correct weekly questionnaire instances on correct week day when user becomes active in study', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${notification_weekday}, ${created_at})',
        weekQuestionnaireWithNotificationDay
      );
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(8);

      const dateNo = 1;

      for (let i = 0; i < addedQI.length; i++) {
        expect(addedQI[i].date_of_issue.getDay()).to.equal(dateNo);
        expect(addedQI[i].study_id).to.equal('ApiTestStudie');
        expect(addedQI[i].user_id).to.equal('QTestProband1');
        expect(addedQI[i].date_of_issue.toISOString()).to.equal(
          nextDayXOfWeek(
            df.addWeeks(
              df.setHours(df.startOfToday(), userSettingsHour),
              i * 2
            ),
            dateNo
          ).toISOString()
        );
      }
    });

    it('should create correct monthly questionnaire instances', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        monthQuestionnaire
      );
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(7);
      for (let i = 0; i < addedQI.length; i++) {
        expect(addedQI[i].study_id).to.equal('ApiTestStudie');
        expect(addedQI[i].user_id).to.equal('QTestProband1');
        expect(addedQI[i].date_of_issue.toISOString()).to.equal(
          df
            .addMonths(df.setHours(df.startOfToday(), userSettingsHour), i * 2)
            .toISOString()
        );
      }
    });

    it('should create correct monthly questionnaire instances on correct week days', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_weekday, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${notification_weekday}, ${created_at})',
        monthQuestionnaireWithNotificationDay
      );
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(7);

      const dateNo = 0;

      for (let i = 0; i < addedQI.length; i++) {
        expect(addedQI[i].date_of_issue.getDay()).to.equal(dateNo);
        expect(addedQI[i].study_id).to.equal('ApiTestStudie');
        expect(addedQI[i].user_id).to.equal('QTestProband1');
        expect(addedQI[i].date_of_issue.toISOString()).to.equal(
          nextDayXOfWeek(
            df.addMonths(
              df.setHours(df.startOfToday(), userSettingsHour),
              i * 2
            ),
            dateNo
          ).toISOString()
        );
      }
    });

    it('should create correct monthly questionnaire and set the date_of_issue starting from current date and not from first_logged_in_at', async function () {
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        monthQuestionnaire2
      );
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 300),
          username: 'QTestProband1',
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(7);
      const startDate = df.addDays(
        df.setHours(df.startOfToday(), userSettingsHour),
        monthQuestionnaire2.activate_after_days
      );
      for (let i = 0; i < addedQI.length; i++) {
        const expectedDate = df.addMonths(
          df.setHours(df.startOfDay(startDate), userSettingsHour),
          2 * i
        );
        expect(addedQI[i].study_id).to.equal('ApiTestStudie');
        expect(addedQI[i].user_id).to.equal('QTestProband1');
        expect(addedQI[i].date_of_issue.toISOString()).to.equal(
          expectedDate.toISOString()
        );
      }
    });

    it('should only create 1 questionnaire instance when adding a questionnaire with condition_type=internal_last', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      const condition = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
    });

    it('should not create any questionnaire instances when adding a questionnaire with condition_type=external that has no answer', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should not create questionnaire instances when adding a questionnaire with condition_type=external that is not met', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '=',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should create questionnaire instances when adding a questionnaire with condition_type=external that is met', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(11);
    });

    it('should create questionnaire instances when updating a questionnaire and deleting the condition that was not met', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Nein',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
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

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(6);
    });

    it('should create questionnaire instances when updating a questionnaire and deleting the internal condition', async function () {
      const condition = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
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
    });

    it('should delete questionnaire instances when updating a questionnaire and adding a condition that is not met', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_questionnaire_version: 1,
        condition_operand: '==',
        condition_value: 'Nein',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_questionnaire_version: 1,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );

      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
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
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Nein',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
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

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should delete questionnaire instances and create 1 new one when updating a questionnaire and changing the condition to internal_last', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      const condition_internal = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQI[0].id,
        }
      );

      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
        question_id: 88888,
        answer_option_id: 88888,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
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

    it('should update questionnaire instances when updating the cycle amount of a questionnaire', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );
      await dbWait(
        'UPDATE questionnaires SET cycle_amount=${cycle_amount} WHERE id=${qId}',
        {
          cycle_amount: 4,
          qId: 99999,
        }
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedQI.length).to.equal(6);
      expect(
        addedQI[0].date_of_issue -
          df.addHours(df.startOfToday(), userSettingsHour)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue -
          df.addDays(df.addHours(df.startOfToday(), userSettingsHour), 4)
      ).to.equal(0);
      expect(
        addedQI[5].date_of_issue -
          df.addDays(df.addHours(df.startOfToday(), userSettingsHour), 20)
      ).to.equal(0);

      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[1].study_id).to.equal('ApiTestStudie');
      expect(addedQI[5].study_id).to.equal('ApiTestStudie');

      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[1].user_id).to.equal('QTestProband1');
      expect(addedQI[5].user_id).to.equal('QTestProband1');
    });

    it('should create one instance for spontan fb when adding the questionnaire and disregard users notification settings', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 10),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        spontanQuestionnaire
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue - df.addDays(df.startOfToday(), -10)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should delete all old instances and add one new one when updateing a daily questionnaire to spontan', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );
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

    it('should create one instance for spontan fb when adding the questionnaire with unused other fields and disregard users notification settings', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 10),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        spontanQuestionnaireWithUnusedValues
      );
      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
      expect(
        addedQI[0].date_of_issue - df.addDays(df.startOfToday(), -5)
      ).to.equal(0);
      expect(addedQI[0].study_id).to.equal('ApiTestStudie');
      expect(addedQI[0].user_id).to.equal('QTestProband1');
      expect(addedQI[0].cycle).to.equal(1);
    });

    it('should delete questionnaire instances when updating the questionnaire to need compliance', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date}, compliance_samples=false WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );

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
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date}, compliance_samples=false WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, compliance_needed, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, true, ${created_at})',
        dayQuestionnaire
      );

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

    it('should not delete or create any instances when questionnaire was deactivated', async function () {
      // Arrange
      const expectedQuestionnaireInstanceCount = 11;
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        dayQuestionnaire
      );
      const addedQI = await db.manyOrNone(
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

    it('should not create any instances of a deactivated questionnaire when a conditional questionnaire was answered', async function () {
      // Arrange
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      // create external questionnaire
      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
      ]);

      const addedExternalQuestionnaireQIs = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: dayQuestionnaire.id }
      );

      // create deactivated questionnaire with external condition
      const deactivatedQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_questionnaire_version: 1,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, active, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${active}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
        questionnaire_instance_id: addedExternalQuestionnaireQIs[0].id,
        question_id: dayQuestion.id,
        answer_option_id: dayAnswerOption.id,
        value: 'Ja',
      };

      await dbWait(
        'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
        externalAnswer
      );
      await dbWait(
        'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date} WHERE id=${id}',
        {
          status: 'released_once',
          date: new Date(),
          id: addedExternalQuestionnaireQIs[0].id,
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

  describe('Autocreate/delete questionnaire instances on questionnaire instance status update for conditional questionnaires', function () {
    beforeEach(async function () {
      await dbWait(
        "UPDATE users SET notification_time=null WHERE username IN ('QTestProband1')"
      );
    });

    it('should not create any instances when inserting answers that dont meet external condition', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Nein',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
          arg: {
            date: df.subDays(new Date(), 5),
            username: 'QTestProband1',
          },
        },
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(0);
    });

    it('should create instances when inserting answers that meet external condition', async function () {
      const dayQuestionnaire = {
        id: 99999,
        study_id: 'ApiTestStudie',
        name: 'TestQuestionnaire',
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
        created_at: df.addDays(df.startOfToday(), -100),
      };

      const dayQuestion = {
        id: 99999,
        questionnaire_id: 99999,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const dayAnswerOption = {
        id: 99999,
        question_id: 99999,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
          arg: {
            date: df.subDays(new Date(), 5),
            username: 'QTestProband1',
          },
        },
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: externalAnswer,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(8);
    });

    it('should create instances when updating answer that was not met before and setting instance to released_twice', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );
      const externalAnswer1 = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
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

      const externalAnswer2 = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
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
    });

    it('should not create additional instances when updating answer that was met before and setting instance to released_twice', async function () {
      const externalQuestionnaire = {
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
        created_at: df.addDays(df.startOfToday(), -100),
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
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: externalQuestionnaire.id,
        condition_target_answer_option: externalAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );
      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        externalQuestionnaire
      );
      await dbWait(
        'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
        externalQuestion
      );
      await dbWait(
        'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
        externalAnswerOption
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition,
        },
      ]);

      const addedExternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 88888 }
      );

      const externalAnswer1 = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
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

      const externalAnswer2 = {
        questionnaire_instance_id: addedExternalQI[0].id,
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
            id: addedExternalQI[0].id,
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
    });

    it('should not create more instances when inserting answer that does not meet internal_last condition', async function () {
      const condition_internal = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
          arg: {
            date: df.subDays(new Date(), 5),
            username: 'QTestProband1',
          },
        },
      ]);

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition_internal,
        },
      ]);

      const addedInternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      const internalAnswer = {
        questionnaire_instance_id: addedInternalQI[0].id,
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
            id: addedInternalQI[0].id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(1);
    });

    it('should create one more instance when inserting answer that does meet internal_last condition', async function () {
      const condition_internal = {
        condition_type: 'internal_last',
        condition_questionnaire_id: dayQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: dayQuestionnaire.id,
        condition_target_answer_option: dayAnswerOption.id,
      };

      await txWait([
        {
          query:
            'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
          arg: {
            date: df.subDays(new Date(), 5),
            username: 'QTestProband1',
          },
        },
      ]);

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
          arg: dayQuestionnaire,
        },
        {
          query:
            'INSERT INTO questions VALUES(${id},${questionnaire_id},${text},${position},${is_mandatory})',
          arg: dayQuestion,
        },
        {
          query:
            'INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position) VALUES(${id},${question_id},${text},${answer_type_id},${values},${position})',
          arg: dayAnswerOption,
        },
        {
          query:
            'INSERT INTO conditions(condition_type,condition_questionnaire_id,condition_target_questionnaire,condition_target_answer_option,condition_operand,condition_value) VALUES(${condition_type},${condition_questionnaire_id},${condition_target_questionnaire},${condition_target_answer_option},${condition_operand},${condition_value})',
          arg: condition_internal,
        },
      ]);

      const addedInternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);
      const internalAnswer = {
        questionnaire_instance_id: addedInternalQI[0].id,
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
            id: addedInternalQI[0].id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);

      expect(addedQI[1].date_of_issue - df.startOfToday()).to.equal(172800000); // Two days difference
    });

    it('should create 3 more instances when inserting 3 answers that do meet internal_last condition for hourly questionnaire', async function () {
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
            'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
          arg: {
            date: df.subDays(new Date(), 5),
            username: 'QTestProband1',
          },
        },
      ]);

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at, cycle_first_hour, cycle_per_day) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at}, ${cycle_first_hour}, ${cycle_per_day})',
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
      const addedInternalQI1 = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI1.length).to.equal(1);
      const internalAnswer1 = {
        questionnaire_instance_id: addedInternalQI1[0].id,
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
            id: addedInternalQI1[0].id,
          },
        },

        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer1,
        },
      ]);

      // Second instance and answer
      const addedInternalQI2 = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} AND cycle=${cycle}',
        {
          qId: 99999,
          cycle: 2,
        }
      );
      expect(addedInternalQI2.length).to.equal(1);
      const internalAnswer2 = {
        questionnaire_instance_id: addedInternalQI2[0].id,
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
            id: addedInternalQI2[0].id,
          },
        },

        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer2,
        },
      ]);

      // Third instance and answer
      const addedInternalQI3 = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} AND cycle=${cycle}',
        {
          qId: 99999,
          cycle: 3,
        }
      );
      expect(addedInternalQI3.length).to.equal(1);
      const internalAnswer3 = {
        questionnaire_instance_id: addedInternalQI3[0].id,
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
            id: addedInternalQI3[0].id,
          },
        },
        {
          query:
            'INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, value) VALUES(${questionnaire_instance_id}, ${question_id}, ${answer_option_id}, ${value})',
          arg: internalAnswer3,
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId} ORDER BY date_of_issue',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(4);
      expect(
        addedQI[0].date_of_issue - df.addHours(df.startOfToday(), 3)
      ).to.equal(0);
      expect(
        addedQI[1].date_of_issue - df.addHours(df.startOfToday(), 3 + 5)
      ).to.equal(0);
      expect(
        addedQI[2].date_of_issue - df.addHours(df.startOfToday(), 3 + 2 * 5)
      ).to.equal(0);
      expect(
        addedQI[3].date_of_issue -
          df.addHours(df.addDays(df.startOfToday(), 1), 3)
      ).to.equal(0);
    });

    it('should create one more instance for spontan questionnaire when last instance is released', async function () {
      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        spontanQuestionnaire
      );

      const addedInternalQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );
      expect(addedInternalQI.length).to.equal(1);

      await txWait([
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v1=${date}, date_of_issue=${date} WHERE id=${id}',
          arg: {
            status: 'released_once',
            date: df.startOfToday(),
            id: addedInternalQI[0].id,
          },
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);
      expect(addedQI[0].date_of_issue - df.startOfToday()).to.equal(0);
      expect(addedQI[1].date_of_issue - df.startOfToday()).to.equal(0);
    });

    it('should not create one more instance for spontan questionnaire when last instance is released twice', async function () {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: fiveDaysAgo,
          username: 'QTestProband1',
        }
      );

      await dbWait(
        'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
        spontanQuestionnaire
      );

      const addedInternalQI = await db.manyOrNone(
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
            id: addedInternalQI[0].id,
          },
        },
        {
          query:
            'UPDATE questionnaire_instances SET status=${status},date_of_release_v2=${date} WHERE id=${id}',
          arg: {
            status: 'released_twice',
            date: new Date(),
            id: addedInternalQI[0].id,
          },
        },
      ]);

      const addedQI = await db.manyOrNone(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=${qId}',
        { qId: 99999 }
      );

      expect(addedQI.length).to.equal(2);
    });

    it('should create all instance queues when inserting answers that meet external condition', async function () {
      const firstQuestionnaire = {
        id: 88880,
        study_id: 'ApiTestStudie',
        name: 'firstQuestionnaire',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: df.addDays(df.startOfToday(), -100),
      };

      const firstQuestion = {
        id: 88880,
        questionnaire_id: 88880,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const firstAnswerOption1 = {
        id: 888801,
        question_id: 88880,
        text: 'Beispielunterfrage1',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const firstAnswerOption2 = {
        id: 888802,
        question_id: 88880,
        text: 'Beispielunterfrage2',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 2,
      };

      const secondQuestionnaire = {
        id: 88881,
        study_id: 'ApiTestStudie',
        name: 'secondQuestionnaire',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: df.addDays(df.startOfToday(), -100),
      };

      const secondQuestion = {
        id: 88881,
        questionnaire_id: 88881,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const secondAnswerOption = {
        id: 88881,
        question_id: 88881,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const thirdQuestionnaire = {
        id: 88882,
        study_id: 'ApiTestStudie',
        name: 'thirdQuestionnaire',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: df.addDays(df.startOfToday(), -100),
      };

      const thirdQuestion = {
        id: 88882,
        questionnaire_id: 88882,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const thirdAnswerOption = {
        id: 88882,
        question_id: 88882,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const fourthQuestionnaire = {
        id: 88883,
        study_id: 'ApiTestStudie',
        name: 'fourthQuestionnaire',
        no_questions: 1,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 15,
        notification_tries: 3,
        notification_title: 'title',
        notification_body_new: 'new',
        notification_body_in_progress: 'old',
        created_at: df.addDays(df.startOfToday(), -100),
      };

      const fourthQuestion = {
        id: 88883,
        questionnaire_id: 88883,
        text: 'Beispielfrage',
        position: 1,
        is_mandatory: false,
      };

      const fourthAnswerOption = {
        id: 88883,
        question_id: 88883,
        text: 'Beispielunterfrage',
        answer_type_id: 1,
        values: [{ value: 'Ja' }, { value: 'Nein' }],
        position: 1,
      };

      const condition1 = {
        condition_type: 'external',
        condition_questionnaire_id: secondQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: firstQuestionnaire.id,
        condition_target_answer_option: firstAnswerOption1.id,
      };

      const condition2 = {
        condition_type: 'external',
        condition_questionnaire_id: thirdQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: firstQuestionnaire.id,
        condition_target_answer_option: firstAnswerOption2.id,
      };

      const condition3 = {
        condition_type: 'external',
        condition_questionnaire_id: fourthQuestionnaire.id,
        condition_operand: '==',
        condition_value: 'Ja',
        condition_target_questionnaire: secondQuestionnaire.id,
        condition_target_answer_option: secondAnswerOption.id,
      };

      await dbWait(
        'UPDATE users SET first_logged_in_at=${date} WHERE username=${username}',
        {
          date: df.subDays(new Date(), 5),
          username: 'QTestProband1',
        }
      );

      await txWait([
        {
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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
          query:
            'INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, created_at) VALUES (${id}, ${study_id}, ${name}, ${no_questions}, ${cycle_amount}, ${cycle_unit}, ${activate_after_days}, ${deactivate_after_days}, ${notification_tries}, ${notification_title}, ${notification_body_new}, ${notification_body_in_progress}, ${created_at})',
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

      const addedFirstQI = await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2 AND release_version=0',
        [firstQuestionnaire.id, 1]
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

      const addedSecondQI = await db.one(
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

      await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [thirdQuestionnaire.id, 1]
      );
      await db.one(
        'SELECT * FROM questionnaire_instances WHERE questionnaire_id=$1 AND cycle=$2',
        [fourthQuestionnaire.id, 1]
      );
      const queues = await db.many(
        "SELECT * FROM questionnaire_instances_queued WHERE user_id='QTestProband1'"
      );
      expect(queues.length).to.equal(3);
    });
  });
});

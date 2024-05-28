/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox } from 'sinon';
import chai from 'chai';
import { NotificationHandlers } from './notificationHandlers';
import { db } from '../db';
import { Questionnaire } from '../models/questionnaire';
import { startOfToday, subDays } from 'date-fns';
import { Proband } from '../models/proband';
import { Condition } from '../models/condition';

const expect = chai.expect;
const sandbox = createSandbox();

/* eslint-disable @typescript-eslint/no-magic-numbers */
describe.skip('notificationHandlers', function () {
  afterEach(() => {
    sandbox.restore();
  });

  describe('handleInsertedQuestionnaire', function () {
    it('should not create any QIs if no user is active in study', async function () {
      const questionnaire = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });
      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves([]).onCall(1).resolves([]);

      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(1);
    });

    it('should create QIs for one user', async function () {
      const questionnaire = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });
      const probands: Proband[] = [createUser('Testuser1', startOfToday())];
      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves(probands);
      const expectedCallCount = 2;
      const expectedCallArg = 2;

      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(dbStub.manyOrNone.calledWith(expectedCallArg)).to.equal(true);
    });

    it('should create QIs for two probands', async function () {
      const questionnaire = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });
      const probands = [
        createUser('Testuser1', startOfToday()),
        createUser('Testuser1', subDays(startOfToday(), 1)),
      ];
      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves(probands);
      const expectedCallCount = 2;
      const expectedCallArg = 4;

      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(dbStub.manyOrNone.calledWith(expectedCallArg)).to.equal(true);
    });

    it('should not create QIs if questionnaire is conditional', async function () {
      const questionnaire = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const qCondition = createCondition({
        condition_questionnaire_id: 1,
        condition_answer_option_id: 1,
        condition_operand: '==',
        condition_value: 'Ja',
      });

      const probands = [
        createUser('Testuser1', startOfToday()),
        createUser('Testuser1', subDays(startOfToday(), 1)),
      ];
      const dbStub = stubDb();
      dbStub.oneOrNone.resolves(qCondition);
      dbStub.manyOrNone.onCall(0).resolves(probands);
      const expectedCallCount = 0;
      const expectedCallArg = 4;

      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(dbStub.manyOrNone.calledWith(expectedCallArg)).to.equal(false);
    });
  });

  describe('handleUpdatedQuestionnaire', function () {
    it('should delete all old qIS and create no new ones if new questionnaire is conditional', async function () {
      const questionnaire_old = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const questionnaire_new = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const dbStub = stubDb();
      dbStub.oneOrNone.resolves({ questionnaire_id: 99999 });
      dbStub.manyOrNone.onCall(0).resolves([]);

      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(1);
    });

    it('should delete all old qIS and create no new ones if no probands are active in study', async function () {
      const questionnaire_old = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const questionnaire_new = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const dbStub = stubDb();
      dbStub.oneOrNone.resolves({ questionnaire_id: 99999 });
      dbStub.manyOrNone.onCall(0).resolves([]);
      dbStub.manyOrNone.onCall(1).resolves([]);
      const expectedCallCount = 2;

      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
    });

    it('should delete all old qIS and create correct number of neq qIs', async function () {
      const questionnaire_old = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,
      });

      const questionnaire_new = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 3,
      });

      const probands = [
        createUser('Testuser1', startOfToday()),
        createUser('Testuser1', subDays(startOfToday(), 1)),
      ];

      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves([]);
      dbStub.manyOrNone.onCall(1).resolves(probands);
      const expectedCallCount = 3;
      const expectedCallArgs = 8;

      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(dbStub.manyOrNone.calledWith(expectedCallArgs)).to.equal(true);
    });

    it('should ignore when a custom name has been automatically generated for a questionnaire', () => {
      // Arrange
      const questionnaire_old = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        custom_name: null,
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const questionnaire_new = createQuestionnaire({
        id: 99999,
        study_id: 'Study1',
        name: 'TestQuestionnaire1',
        custom_name: 'CustomName1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      // Act
      const resultNullName = NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      // Assert
      expect(resultNullName).to.be.undefined;

      // Act
      const resultEmptyName = NotificationHandlers.handleUpdatedQuestionnaire(
        { ...questionnaire_old, custom_name: '' },
        questionnaire_new
      );

      // Assert
      expect(resultEmptyName).to.be.undefined;
    });
  });

  function createUser(
    pseudonym: string,
    first_logged_in_at: Date | null
  ): Proband {
    return {
      pseudonym: pseudonym,
      first_logged_in_at: first_logged_in_at,
      compliance_labresults: true,
      compliance_samples: true,
      compliance_bloodsamples: true,
      needs_material: false,
      study_center: 'string',
      examination_wave: 1,
      is_test_proband: false,
      status: 'active',
      ids: null,
      study: 'TestStudy',
    };
  }

  function createQuestionnaire(
    questionnaire: Partial<Questionnaire>
  ): Questionnaire {
    return {
      id: 99999,
      study_id: 'Study1',
      name: 'TestQuestionnaire1',
      custom_name: '',
      no_questions: 2,
      cycle_amount: 0,
      cycle_unit: 'once',
      activate_after_days: 1,
      deactivate_after_days: 0,
      notification_tries: 1,
      notification_title: 'string',
      notification_body_new: 'string',
      notification_body_in_progress: 'string',
      notification_weekday: 'sunday',
      notification_interval: 2,
      notification_interval_unit: 'days',
      activate_at_date: 'string',
      compliance_needed: false,
      expires_after_days: 14,
      finalises_after_days: 2,
      cycle_per_day: 1,
      cycle_first_hour: 1,
      created_at: new Date(),
      updated_at: new Date(),
      type: 'for_probands',
      version: 1,
      publish: 'string',
      notify_when_not_filled: false,
      notify_when_not_filled_time: '08:00',
      notify_when_not_filled_day: 3,
      keep_answers: false,
      active: true,
      ...questionnaire,
    };
  }

  function createCondition(conditionOverwrite: Partial<Condition>): Condition {
    return {
      condition_type: 'internal_this',
      condition_answer_option_id: 1,
      condition_question_id: 1,
      condition_questionnaire_id: 1,
      condition_questionnaire_version: 1,
      condition_target_questionnaire: 1,
      condition_target_questionnaire_version: 1,
      condition_target_answer_option: 1,
      condition_target_question_pos: 1,
      condition_target_answer_option_pos: 1,
      condition_value: 'string',
      condition_operand: '==',
      condition_link: null,
      ...conditionOverwrite,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function stubDb() {
    const txMock = {
      oneOrNone: sandbox.stub().resolves(null),
      manyOrNone: sandbox
        .stub()
        .onCall(0)
        .resolves(null)
        .onCall(1)
        .resolves(null),
    };
    // see: https://vitaly-t.github.io/pg-promise/module-pg-promise.html
    sandbox
      .stub(db, 'tx')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .callsFake((cb: (t: unknown) => void): void => cb(txMock));
    sandbox.stub(db.$config.pgp.helpers).update.callsFake(
      // eslint-disable-next-line @typescript-eslint/ban-types
      (dummy1: object | object[]) => (Array.isArray(dummy1) ? dummy1.length : 0)
    );
    return txMock;
  }
});

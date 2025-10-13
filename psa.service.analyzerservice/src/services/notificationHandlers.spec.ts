/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chai from 'chai';
import { startOfToday, subDays } from 'date-fns';
import { ITask } from 'pg-promise';
import { createSandbox } from 'sinon';
import { db } from '../db';
import { Condition } from '../models/condition';
import { Proband } from '../models/proband';
import { Questionnaire } from '../models/questionnaire';
import { ConditionsService } from './conditionsService';
import { NotificationHandlers } from './notificationHandlers';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';

const expect = chai.expect;
const sandbox = createSandbox();

/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('notificationHandlers', function () {
  afterEach(() => {
    sandbox.restore();
  });

  describe('handleInsertedQuestionnaire', function () {
    it('should not create any QIs if no user is active in study', async function () {
      // Arrange
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
      // Arrange
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
      sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves(probands);

      stubDb();
      const createQuestionnaireInstancesStub = sandbox
        .stub(
          NotificationHandlers as any,
          'createQuestionnaireInstancesForProbands'
        )
        .resolves([]);

      // Act
      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      // Assert
      expect(createQuestionnaireInstancesStub.callCount).to.equal(1);
      expect(
        createQuestionnaireInstancesStub.calledWith(
          questionnaire, // transaction object
          probands
        )
      ).to.be.true;
    });

    it('should create QIs for two probands', async function () {
      // Arrange
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
      sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves(probands);
      stubDb();
      const createQuestionnaireInstancesStub = sandbox
        .stub(
          NotificationHandlers as any,
          'createQuestionnaireInstancesForProbands'
        )
        .resolves([]);

      // Act
      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      // Assert
      expect(createQuestionnaireInstancesStub.callCount).to.equal(1);
      expect(
        createQuestionnaireInstancesStub.calledWith(
          questionnaire, // transaction object
          probands
        )
      ).to.be.true;
    });

    it('should not create QIs if questionnaire is conditional', async function () {
      // Arrange
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
        condition_type: 'external',
      });
      sandbox
        .stub(ConditionsService as any, 'getConditionFor')
        .resolves(qCondition);
      sandbox
        .stub(
          QuestionnaireInstancesService as any,
          'getLatestAnswersForCondition'
        )
        .resolves([]);

      const probands = [
        createUser('Testuser1', startOfToday()),
        createUser('Testuser1', subDays(startOfToday(), 1)),
      ];
      sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves(probands);
      stubDb();
      const createQuestionnaireInstancesStub = sandbox
        .stub(NotificationHandlers as any, 'createQuestionnaireInstances')
        .resolves([]);

      // Act
      await NotificationHandlers.handleInsertedQuestionnaire(questionnaire);

      // Assert
      expect(createQuestionnaireInstancesStub.callCount).to.equal(1);
      expect(createQuestionnaireInstancesStub.calledWithExactly([])).to.be.true;
    });
  });

  describe('handleUpdatedQuestionnaire', function () {
    it('should delete all old qIS and create no new ones if new questionnaire is conditional', async function () {
      // Arrange
      const studyId = 'Study1';
      const questionnaire_old = createQuestionnaire({
        id: 99999,
        study_id: studyId,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const questionnaire_new = createQuestionnaire({
        id: 99999,
        study_id: studyId,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      });

      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves([]);
      dbStub.manyOrNone.onCall(1).resolves([]);
      const getProbandsStub = sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves([
          {
            pseudonym: 'test-user',
            study: studyId,
          },
        ]);

      const createQuestionnaireInstancesStub = sandbox
        .stub(NotificationHandlers as any, 'createQuestionnaireInstances')
        .resolves([]);

      // Act
      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      // Assert
      expect(dbStub.manyOrNone.callCount).to.equal(2);
      expect(
        getProbandsStub.calledWith(
          sandbox.match.any, // transaction object
          studyId
        )
      ).to.be.true;
      expect(createQuestionnaireInstancesStub.calledWithExactly([])).to.be.true;
    });

    it('should delete all old qIS and create no new ones if no probands are active in study', async function () {
      // Arrange
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
      dbStub.manyOrNone.onCall(0).resolves([]);
      dbStub.manyOrNone.onCall(1).resolves([]);
      const expectedCallCount = 2;

      sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves([]);
      const createQuestionnaireInstancesStub = sandbox
        .stub(NotificationHandlers as any, 'createQuestionnaireInstances')
        .resolves([]);

      // Act
      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      // Assert
      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(createQuestionnaireInstancesStub.notCalled).to.be.true;
    });

    it('should delete all old qIS and create correct number of new qIs', async function () {
      // Arrange
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
      sandbox
        .stub(NotificationHandlers as any, 'getProbandsOfStudy')
        .resolves(probands);

      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves([]);
      dbStub.manyOrNone.onCall(1).resolves([]);
      const expectedCallCount = 2;
      const expectedNewQisLength = 8;

      const createQuestionnaireInstancesStub = sandbox
        .stub(NotificationHandlers as any, 'createQuestionnaireInstances')
        .resolves([]);

      // Act
      await NotificationHandlers.handleUpdatedQuestionnaire(
        questionnaire_old,
        questionnaire_new
      );

      // Assert
      expect(dbStub.oneOrNone.callCount).to.equal(1);
      expect(dbStub.manyOrNone.callCount).to.equal(expectedCallCount);
      expect(
        createQuestionnaireInstancesStub.getCall(0).args[0]
      ).to.have.length(expectedNewQisLength);
    });

    it('should ignore when a custom name has been automatically generated for a questionnaire', async () => {
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

      const dbStub = stubDb();

      // Act
      const resultNullName =
        await NotificationHandlers.handleUpdatedQuestionnaire(
          questionnaire_old,
          questionnaire_new
        );

      // Assert
      expect(resultNullName).to.be.undefined;
      expect(dbStub.manyOrNone.callCount).to.equal(0);

      // Act
      const resultEmptyName =
        await NotificationHandlers.handleUpdatedQuestionnaire(
          { ...questionnaire_old, custom_name: '' },
          questionnaire_new
        );

      // Assert
      expect(resultEmptyName).to.be.undefined;
      expect(dbStub.manyOrNone.callCount).to.equal(0);
    });
  });

  describe('deleteObsoleteQuestionnaireInstances', function () {
    it('should only delete QIs for the specified proband ', async function () {
      // Arrange
      const questionnaire = createQuestionnaire({});

      const pseudonym = 'THIS_IS_A_PSEUDONYM_NOT_IN_THE_QUESTIONNAIRE';
      const user = createUser(pseudonym, new Date());

      const dbStub = stubDb();
      dbStub.manyOrNone.onCall(0).resolves([]);

      // Act
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      await (NotificationHandlers as any).deleteObsoleteQuestionnaireInstances(
        dbStub as unknown as ITask<unknown>,
        questionnaire,
        user
      );

      // Assert
      expect(dbStub.manyOrNone.callCount).to.equal(1);
      expect(
        dbStub.manyOrNone.calledWith(
          sandbox.match((query: string) =>
            query.includes('DELETE FROM questionnaire_instances')
          ),
          sandbox.match((args: unknown[]) => args.includes(pseudonym))
        )
      ).to.be.true;
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
      sort_order: null,
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
      one: sandbox.stub().resolves(null),
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

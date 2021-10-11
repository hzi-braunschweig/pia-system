/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox, SinonStub } from 'sinon';
import chai, { expect } from 'chai';

import { SormasEndDateService } from './sormasEndDateService';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';
import { addDays, startOfToday, subDays } from 'date-fns';
import { db } from '../db';
import { Questionnaire } from '../models/questionnaire';
import { User } from '../models/user';
import { Answer } from '../models/answer';
import { Condition } from '../models/condition';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

const sandbox = createSandbox();

/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('questionnaireInstancesService', function () {
  let sormasEndDateServiceStub: SinonStub;

  beforeEach(() => {
    sormasEndDateServiceStub = sandbox.stub(
      SormasEndDateService,
      'getEndDateForUUID'
    );
    sormasEndDateServiceStub.resolves(addDays(new Date(), 20));
    sormasEndDateServiceStub
      .withArgs('IDS-EXPIRED')
      .resolves(subDays(new Date(), 1));
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('checkAndUpdateQuestionnaireInstancesStatus', function () {
    it('should not activate qis if their date is in the future', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 2),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(0);
    });

    it('should activate all qis if all their dates are in the past or today', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: subDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: startOfToday(),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(1);
      expect(dbStub.many).to.have.been.calledWith(
        '2WHERE v.id = t.id RETURNING *'
      );
    });

    it('should activate only the qis whos dates are in the past or today', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: subDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 1),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(1);
      expect(dbStub.many).to.have.been.calledWith(
        '1WHERE v.id = t.id RETURNING *'
      );
    });
  });

  describe('createQuestionnaireInstances', function () {
    it.skip('should return correct questionnaire instances', async function () {
      const user: User = createUser('Testuser1', subDays(startOfToday(), 1));

      const questionnaire: Questionnaire = createQuestionnaire({
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,
      });

      const res =
        await QuestionnaireInstancesService.createQuestionnaireInstances(
          questionnaire,
          user,
          false
        );

      expect(res.length).to.equal(3);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue).to.equal(subDays(startOfToday(), 1));
      expect(res[0]?.status).to.equal('active');

      expect(res[1]?.study_id).to.equal('Study1');
      expect(res[1]?.questionnaire_id).to.equal(99999);
      expect(res[1]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[1]?.user_id).to.equal('Testuser1');
      expect(res[2]?.date_of_issue).to.equal(startOfToday());
      expect(res[1]?.status).to.equal('active');

      expect(res[2]?.study_id).to.equal('Study1');
      expect(res[2]?.questionnaire_id).to.equal(99999);
      expect(res[2]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[2]?.user_id).to.equal('Testuser1');
      expect(res[2]?.date_of_issue).to.equal(addDays(startOfToday(), 1));
      expect(res[2]?.status).to.equal('inactive');
    });

    it.skip('should return correct questionnaire instances for one time questionnaire', async function () {
      const user: User = createUser('Testuser1', subDays(startOfToday(), 1));
      const questionnaire: Questionnaire = createQuestionnaire({
        no_questions: 2,
        cycle_amount: 0,
        cycle_unit: 'once',
        activate_after_days: 1,
        deactivate_after_days: 0,
      });

      const res =
        await QuestionnaireInstancesService.createQuestionnaireInstances(
          questionnaire,
          user,
          false
        );

      expect(res.length).to.equal(1);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue).to.equal(startOfToday());
      expect(res[0]?.status).to.equal('active');
    });
  });

  describe('isConditionMet', function () {
    it('1 answer value, 1 condition value, operand ===, no link, positive example', function () {
      const answer = createAnswer('Ja');
      const condition = createCondition({
        condition_value: 'Ja',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition value, operand ===, no link, negative example', function () {
      const answer = createAnswer('Ja');
      const condition = createCondition({
        condition_value: 'Nein',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 1 condition value, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans2',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 1 condition value, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans4',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans2;ans4;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = createAnswer('ans2;ans4;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, positive example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = createAnswer('ans1;ans2;ans4');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = createAnswer('ans0;ans2;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', function () {
      const answer = createAnswer('ans1;ans2;ans4');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', function () {
      const answer = createAnswer('ans0;ans2;ans5;');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3;',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '<',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '22',
        condition_operand: '<',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '22',
        condition_operand: '>',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '>',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '<=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '<=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '13',
        condition_operand: '>=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '>=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '\\=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '11',
        condition_operand: '\\=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ==, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ==, date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '<',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand < date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '<',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '>',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand > date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: subDays(startOfToday(), 1).toDateString(),
        condition_operand: '>',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: subDays(startOfToday(), 1).toDateString(),
        condition_operand: '<=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand <= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '<=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '>=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand >= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '>=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand \\=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '\\=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand \\= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '\\=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });
  });

  describe('isExpired', () => {
    it('should return false if neither sormas end date nor questionnaire expiration date is reached', async () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 15);
      const expires_after_days = 30;
      const questionnaireInstanceIds = 'IDS-NOT-EXPIRED';

      // Act
      const result = await QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days,
        questionnaireInstanceIds
      );

      expect(result).to.equal(false);
    });

    it('should return false if sormas end date is undefined and questionnaire expiration date is not reached', async () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 15);
      const expires_after_days = 30;

      // Act
      const result = await QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days
      );

      expect(result).to.equal(false);
    });

    it('should return true if sormas end date is reached', async () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 15);
      const expires_after_days = 30;
      const questionnaireInstanceIds = 'IDS-EXPIRED';

      // Act
      const result = await QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days,
        questionnaireInstanceIds
      );

      expect(result).to.equal(true);
    });

    it('should return true if sormas end date is not reached but questionnaire expiration date is reached', async () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 31);
      const expires_after_days = 30;
      const questionnaireInstanceIds = 'IDS-NOT-EXPIRED';

      // Act
      const result = await QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days,
        questionnaireInstanceIds
      );

      expect(result).to.equal(true);
    });
  });

  function createUser(username: string, first_logged_in_at: Date | null): User {
    return {
      id: 1,
      username: username,
      password: 'string',
      token: 'string',
      token_login: 'string',
      logged_in_with: 'string',
      first_logged_in_at: first_logged_in_at,
      compliance_labresults: true,
      compliance_samples: true,
      compliance_bloodsamples: true,
      needs_material: false,
      pw_change_needed: false,
      role: 'Proband',
      study_center: 'string',
      examination_wave: 1,
      logging_active: true,
      notification_time: '07:00',
      is_test_proband: false,
    };
  }

  function createQuestionnaire(
    questionnaire: Partial<Questionnaire>
  ): Questionnaire {
    return {
      id: 99999,
      study_id: 'Study1',
      name: 'TestQuestionnaire1',
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
      notification_interval_unit: 'string',
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

  function createAnswer(value: string): Answer {
    return {
      question_id: 1,
      questionnaire_instance_id: 2,
      answer_option_id: 3,
      value: value,
    };
  }

  function createCondition(conditionOverwrite: Partial<Condition>): Condition {
    return {
      condition_type: 'external',
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
  function stubDb<T>(returnValues: T[]) {
    const dbStub = {
      manyOrNone: sandbox.stub(db, 'manyOrNone').resolves(returnValues),
      many: sandbox.stub(db, 'many').resolves(),
      tx: sandbox
        .stub(db, 'tx')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .callsFake((cb: (t: unknown) => void): void => cb(dbStub)),
      $config: {
        pgp: {
          helpers: sandbox.stub(db.$config.pgp.helpers).update.callsFake(
            // eslint-disable-next-line @typescript-eslint/ban-types
            (dummy1: object | object[]) =>
              Array.isArray(dummy1) ? dummy1.length : 0
          ),
        },
      },
    };
    return dbStub;
  }
});

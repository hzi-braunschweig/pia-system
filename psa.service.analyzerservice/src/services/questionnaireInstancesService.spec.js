const { expect } = require('chai');
const sinon = require('sinon');
const sormasEndDateService = require('./sormasEndDateService');
const sut = require('./questionnaireInstancesService.js');

describe('questionnaireInstancesService', function () {
  describe('checkAndUpdateQuestionnaireInstancesStatus', function () {
    it('should not activate qis if their date is in the future', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: new Date(Date.today()).add(1).days(),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: new Date(Date.today()).add(2).days(),
          status: 'inactive',
        },
      ];

      const dbMock = {
        tx: function (callback) {
          return callback(dbMock);
        },
        manyOrNone: sinon.stub().resolves(qInstances),
        $config: {
          pgp: {
            helpers: {
              update: function (dummy1) {
                return dummy1;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        many: sinon.stub().resolves(),
      };

      await sut.checkAndUpdateQuestionnaireInstancesStatus(dbMock);

      expect(dbMock.manyOrNone.callCount).to.equal(1);
      expect(dbMock.many.callCount).to.equal(0);
    });

    it('should activate all qis if all their dates are in the past or today', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: new Date(Date.today()).add(-1).days(),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: new Date(Date.today()),
          status: 'inactive',
        },
      ];

      const dbMock = {
        tx: function (callback) {
          return callback(dbMock);
        },
        manyOrNone: sinon.stub().resolves(qInstances),
        $config: {
          pgp: {
            helpers: {
              update: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        many: sinon.stub().resolves(),
      };

      await sut.checkAndUpdateQuestionnaireInstancesStatus(dbMock);

      expect(dbMock.manyOrNone.callCount).to.equal(1);
      expect(dbMock.many.callCount).to.equal(1);
      expect(dbMock.many.calledWith('2WHERE v.id = t.id RETURNING *')).to.equal(
        true
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
          date_of_issue: new Date(Date.today()).add(-1).days(),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: new Date(Date.today()).add(1).days(),
          status: 'inactive',
        },
      ];

      const dbMock = {
        tx: function (callback) {
          return callback(dbMock);
        },
        manyOrNone: sinon.stub().resolves(qInstances),
        $config: {
          pgp: {
            helpers: {
              update: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        many: sinon.stub().resolves(),
      };

      await sut.checkAndUpdateQuestionnaireInstancesStatus(dbMock);

      expect(dbMock.manyOrNone.callCount).to.equal(1);
      expect(dbMock.many.callCount).to.equal(1);
      expect(dbMock.many.calledWith('1WHERE v.id = t.id RETURNING *')).to.equal(
        true
      );
    });
  });

  describe('createQuestionnaireInstances', function () {
    it('should return empty array if user is null', async function () {
      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const res = await sut.createQuestionnaireInstances(questionnaire, null);
      expect(res.length).to.equal(0);
    });

    it('should return empty array if user is undefined', async function () {
      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const res = await sut.createQuestionnaireInstances(
        questionnaire,
        undefined
      );
      expect(res.length).to.equal(0);
    });

    it('should return empty array if questionnaire is null', async function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today()),
      };

      const res = await sut.createQuestionnaireInstances(null, user);
      expect(res.length).to.equal(0);
    });

    it('should return empty array if questionnaire is undefined', async function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today()),
      };

      const res = await sut.createQuestionnaireInstances(undefined, user);
      expect(res.length).to.equal(0);
    });

    it.skip('should return correct questionnaire instances', async function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).days()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,
      };

      const res = await sut.createQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(3);
      expect(res[0].study_id).to.equal(1);
      expect(res[0].questionnaire_id).to.equal(99999);
      expect(res[0].questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0].user_id).to.equal('Testuser1');
      Date.equals(res[0].date_of_issue, Date.today().add(-1).days());
      expect(res[0].status).to.equal('active');

      expect(res[1].study_id).to.equal(1);
      expect(res[1].questionnaire_id).to.equal(99999);
      expect(res[1].questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[1].user_id).to.equal('Testuser1');
      Date.equals(res[2].date_of_issue, Date.today());
      expect(res[1].status).to.equal('active');

      expect(res[2].study_id).to.equal(1);
      expect(res[2].questionnaire_id).to.equal(99999);
      expect(res[2].questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[2].user_id).to.equal('Testuser1');
      Date.equals(res[2].date_of_issue, Date.today().add(1).days());
      expect(res[2].status).to.equal('inactive');
    });

    it.skip('should return correct questionnaire instances for one time questionnaire', async function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).days()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 0,
        cycle_unit: 'once',
        activate_after_days: 1,
        deactivate_after_days: 0,
      };

      const res = await sut.createQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(1);
      expect(res[0].study_id).to.equal(1);
      expect(res[0].questionnaire_id).to.equal(99999);
      expect(res[0].questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0].user_id).to.equal('Testuser1');
      Date.equals(res[0].date_of_issue, Date.today());
      expect(res[0].status).to.equal('active');
    });
  });

  describe('getDatesForQuestionnaireInstances', function () {
    it('should return empty array if user is null', function () {
      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, null);

      expect(res.length).to.equal(0);
    });

    it('should return empty array if user is undefined', function () {
      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const res = sut.getDatesForQuestionnaireInstances(
        questionnaire,
        undefined
      );

      expect(res.length).to.equal(0);
    });

    it('should return empty array if questionnaire is null', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today()),
      };

      const res = sut.getDatesForQuestionnaireInstances(null, user);

      expect(res.length).to.equal(0);
    });

    it('should return empty array if questionnaire is undefined', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today()),
      };

      const res = sut.getDatesForQuestionnaireInstances(undefined, user);

      expect(res.length).to.equal(0);
    });

    it.skip('should return correct dates for dayly cycle', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'day',
        activate_after_days: 1,
        deactivate_after_days: 4,
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(3);
      Date.equals(res[0], Date.today().add(1).days());
      Date.equals(res[1], Date.today().add(3).days());
      Date.equals(res[2], Date.today().add(5).days());
    });

    it.skip('should return correct dates for weekly cycle', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-5).days()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'week',
        activate_after_days: 2,
        deactivate_after_days: 28,
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(3);
      Date.equals(res[0], Date.today().add(-3).days());
      Date.equals(res[1], Date.today().add(11).days());
      Date.equals(res[2], Date.today().add(25).days());
    });

    it.skip('should return correct dates for weekly cycle with set week day', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-5).days()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'week',
        activate_after_days: 2,
        deactivate_after_days: 28,
        notification_weekday: 'tuesday',
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);
      const dateNo = Date.getDayNumberFromName(
        questionnaire.notification_weekday
      );

      expect(res.length).to.equal(3);
      Date.equals(
        res[0],
        Date.today().add(-3).days().getDay === dateNo
          ? Date.today().add(-3).days()
          : Date.today().add(-3).days().moveToDayOfWeek(dateNo)
      );
      Date.equals(
        res[1],
        Date.today().add(11).days().getDay === dateNo
          ? Date.today().add(11).days()
          : Date.today().add(11).days().moveToDayOfWeek(dateNo)
      );
      Date.equals(
        res[2],
        Date.today().add(25).days().getDay === dateNo
          ? Date.today().add(25).days()
          : Date.today().add(25).days().moveToDayOfWeek(dateNo)
      );
    });

    it.skip('should return correct dates for monthly cycle', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).months()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'month',
        activate_after_days: 2,
        deactivate_after_days: 70,
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(2);
      Date.equals(res[0], Date.today().add(-1).months().add(2).days());
      Date.equals(res[1], Date.today().add(1).months().add(2).days());
    });

    it.skip('should return correct dates for monthly cycle with set week day', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).months()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 2,
        cycle_unit: 'month',
        activate_after_days: 2,
        deactivate_after_days: 70,
        notification_weekday: 'friday',
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);
      const dateNo = Date.getDayNumberFromName(
        questionnaire.notification_weekday
      );

      expect(res.length).to.equal(2);
      Date.equals(
        res[0],
        Date.today().add(-1).months().add(2).days().getDay === dateNo
          ? Date.today().add(-1).months().add(2).days()
          : Date.today().add(-1).months().add(2).days().moveToDayOfWeek(dateNo)
      );
      Date.equals(
        res[1],
        Date.today().add(1).months().add(2).days().getDay === dateNo
          ? Date.today().add(1).months().add(2).days()
          : Date.today().add(1).months().add(2).days().moveToDayOfWeek(dateNo)
      );
    });

    it.skip('should return correct dates for one time questionnaire', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).months()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 0,
        cycle_unit: 'once',
        activate_after_days: 2,
        deactivate_after_days: 0,
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);

      expect(res.length).to.equal(1);
      Date.equals(res[0], Date.today().add(-1).months().add(2).days());
    });

    it.skip('should return correct dates for one time questionnaire with set week day', function () {
      const user = {
        username: 'Testuser1',
        first_logged_in_at: new Date(Date.today().add(-1).months()),
      };

      const questionnaire = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 0,
        cycle_unit: 'once',
        activate_after_days: 2,
        deactivate_after_days: 0,
        notification_weekday: 'thursday',
      };

      const res = sut.getDatesForQuestionnaireInstances(questionnaire, user);
      const dateNo = Date.getDayNumberFromName(
        questionnaire.notification_weekday
      );

      expect(res.length).to.equal(1);
      Date.equals(
        res[0],
        Date.today().add(-1).months().add(2).days().getDay === dateNo
          ? Date.today().add(-1).months().add(2).days()
          : Date.today().add(-1).months().add(2).days().moveToDayOfWeek(dateNo)
      );
    });
  });

  describe('isConditionMet', function () {
    it('1 answer value, 1 condition value, operand ===, no link, positive example', function () {
      const answer = { value: 'Ja' };
      const condition = { condition_value: 'Ja', condition_operand: '==' };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition value, operand ===, no link, negative example', function () {
      const answer = { value: 'Ja' };
      const condition = { condition_value: 'Nein', condition_operand: '==' };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 1 condition value, operand ===, no link, positive example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = { condition_value: 'ans2', condition_operand: '==' };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 1 condition value, operand ===, no link, negative example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = { condition_value: 'ans4', condition_operand: '==' };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, no link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, no link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, positive example', function () {
      const answer = { value: 'ans2;ans4;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, negative example', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = { value: 'ans2;ans4;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, positive example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = { value: 'ans1;ans2;ans4' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = { value: 'ans0;ans2;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', function () {
      const answer = { value: 'ans1;ans2;ans4' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', function () {
      const answer = { value: 'ans0;ans2;ans5;' };
      const condition = {
        condition_value: 'ans1;ans2;ans3;',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = sut.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '8',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '12',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '8',
        condition_operand: '<',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '22',
        condition_operand: '<',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '22',
        condition_operand: '>',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '8',
        condition_operand: '>',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '8',
        condition_operand: '<=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '12',
        condition_operand: '<=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '13',
        condition_operand: '>=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '12',
        condition_operand: '>=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, negative example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '12',
        condition_operand: '\\=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, positive example', function () {
      const answer = { value: '12' };
      const condition = {
        condition_value: '11',
        condition_operand: '\\=',
        condition_link: 'OR',
      };

      const actual = sut.isConditionMet(answer, condition, 3);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ==, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(1).days().toDateString(),
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ==, date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '==',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '<',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand < date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(1).days().toDateString(),
        condition_operand: '<',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '>',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand > date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(-1).days().toDateString(),
        condition_operand: '>',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <=, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(-1).days().toDateString(),
        condition_operand: '<=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand <= date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '<=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >=, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(1).days().toDateString(),
        condition_operand: '>=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand >= date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '>=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand \\=, date, negative example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().toDateString(),
        condition_operand: '\\=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand \\= date, positive example', function () {
      const answer = { value: Date.today().toDateString() };
      const condition = {
        condition_value: Date.today().add(1).days().toDateString(),
        condition_operand: '\\=',
      };

      const actual = sut.isConditionMet(answer, condition, 5);

      expect(actual).to.equal(true);
    });
  });

  describe('isExpired', () => {
    let sormasEndDateServiceStub;

    before(() => {
      sormasEndDateServiceStub = sinon.stub(
        sormasEndDateService,
        'getEndDateForUUID'
      );
    });

    it('should return false if neither sormas end date nor questionnaire expiration date is reached', async () => {
      // Arrange
      const qInstance = {
        ids: 'ABC001',
        date_of_issue: new Date().addDays(-15),
        expires_after_days: 30,
      };
      const sormasEndDate = new Date().addDays(20);
      const expires_after_days = 30;
      const curDate = new Date();
      sormasEndDateServiceStub.resolves(sormasEndDate);

      // Act
      const result = await sut.isExpired(
        qInstance,
        expires_after_days,
        curDate
      );

      expect(result).to.equal(false);
    });

    it('should return false if sormas end date is undefined and questionnaire expiration date is not reached', async () => {
      // Arrange
      const qInstance = {
        ids: 'ABC001',
        date_of_issue: new Date().addDays(-15),
        expires_after_days: 30,
      };
      const sormasEndDate = undefined;
      const expires_after_days = 30;
      const curDate = new Date();
      sormasEndDateServiceStub.resolves(sormasEndDate);

      // Act
      const result = await sut.isExpired(
        qInstance,
        expires_after_days,
        curDate
      );

      expect(result).to.equal(false);
    });

    it('should return true if sormas end date is reached', async () => {
      // Arrange
      const qInstance = {
        ids: 'ABC001',
        date_of_issue: new Date().addDays(-15),
      };
      const sormasEndDate = new Date().addDays(-1);
      const expires_after_days = 30;
      const curDate = new Date();
      sormasEndDateServiceStub.resolves(sormasEndDate);

      // Act
      const result = await sut.isExpired(
        qInstance,
        expires_after_days,
        curDate
      );

      expect(result).to.equal(true);
    });

    it('should return true if sormas end date is not reached but questionnaire expiration date is reached', async () => {
      // Arrange
      const qInstance = {
        ids: 'ABC001',
        date_of_issue: new Date().addDays(-31),
      };
      const sormasEndDate = new Date().addDays(20);
      const expires_after_days = 30;
      const curDate = new Date();
      sormasEndDateServiceStub.resolves(sormasEndDate);

      // Act
      const result = await sut.isExpired(
        qInstance,
        expires_after_days,
        curDate
      );

      expect(result).to.equal(true);
    });
  });
});

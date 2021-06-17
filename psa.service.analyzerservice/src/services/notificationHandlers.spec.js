const sinon = require('sinon');
const { expect } = require('chai');
const sut = require('./notificationHandlers.js');

describe.skip('notificationHandlers', function () {
  afterEach(() => {
    sinon.restore();
  });

  describe('handleInsertedQuestionnaire', function () {
    it('should not create any QIs if no user is active in study', async function () {
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

      const txMock = {
        oneOrNone: sinon.stub().resolves(null),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves([]);
      txMock.manyOrNone.onCall(1).resolves([]);

      await sut.handleInsertedQuestionnaire(dbMock, questionnaire);

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(1);
    });

    it('should create QIs for one user', async function () {
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

      const users = [
        {
          username: 'Testuser1',
          first_logged_in_at: new Date(Date.today()),
        },
      ];

      const txMock = {
        oneOrNone: sinon.stub().resolves(null),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(users);
      txMock.manyOrNone.onCall(1).resolves();

      await sut.handleInsertedQuestionnaire(dbMock, questionnaire);

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(2);
      expect(txMock.manyOrNone.calledWith(2)).to.equal(true);
    });

    it('should create QIs for two users', async function () {
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

      const users = [
        {
          username: 'Testuser1',
          first_logged_in_at: new Date(Date.today()),
        },
        {
          username: 'Testuser2',
          first_logged_in_at: new Date(Date.today().add(-1).days()),
        },
      ];

      const txMock = {
        oneOrNone: sinon.stub().resolves(null),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(users);
      txMock.manyOrNone.onCall(1).resolves();

      await sut.handleInsertedQuestionnaire(dbMock, questionnaire);

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(2);
      expect(txMock.manyOrNone.calledWith(4)).to.equal(true);
    });

    it('should not create QIs if questionnaire is conditional', async function () {
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

      const qCondition = {
        questionnaire_id: 99999,
        condition_questionnaire_id: 1,
        condition_answer_option_id: 1,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      const users = [
        {
          username: 'Testuser1',
          first_logged_in_at: new Date(Date.today()),
        },
        {
          username: 'Testuser2',
          first_logged_in_at: new Date(Date.today().add(-1).days()),
        },
      ];

      const txMock = {
        oneOrNone: sinon.stub().resolves(qCondition),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(users);
      txMock.manyOrNone.onCall(1).resolves();

      await sut.handleInsertedQuestionnaire(dbMock, questionnaire);

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(0);
      expect(txMock.manyOrNone.calledWith(4)).to.equal(false);
    });
  });

  describe('handleUpdatedQuestionnaire', function () {
    it('should delete all old qIS and create no new ones if new questionnaire is conditional', async function () {
      const questionnaire_old = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const questionnaire_new = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const txMock = {
        oneOrNone: sinon.stub().resolves({ questionnaire_id: 99999 }),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves([]);

      await sut.handleUpdatedQuestionnaire(
        dbMock,
        questionnaire_old,
        questionnaire_new
      );

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(1);
    });

    it('should delete all old qIS and create no new ones if no users are active in study', async function () {
      const questionnaire_old = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const questionnaire_new = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 1,
      };

      const txMock = {
        oneOrNone: sinon.stub().resolves(null),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves([]);
      txMock.manyOrNone.onCall(1).resolves([]);

      await sut.handleUpdatedQuestionnaire(
        dbMock,
        questionnaire_old,
        questionnaire_new
      );

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(2);
    });

    it('should delete all old qIS and create correct number of neq qIs', async function () {
      const questionnaire_old = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,
      };

      const questionnaire_new = {
        id: 99999,
        study_id: 1,
        name: 'TestQuestionnaire1',
        no_questions: 2,
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 3,
      };

      const users = [
        {
          username: 'Testuser1',
          first_logged_in_at: new Date(Date.today()),
        },
        {
          username: 'Testuser2',
          first_logged_in_at: new Date(Date.today().add(-1).days()),
        },
      ];

      const txMock = {
        oneOrNone: sinon.stub().resolves(null),
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves([]);
      txMock.manyOrNone.onCall(1).resolves(users);

      await sut.handleUpdatedQuestionnaire(
        dbMock,
        questionnaire_old,
        questionnaire_new
      );

      expect(txMock.oneOrNone.callCount).to.equal(1);
      expect(txMock.manyOrNone.callCount).to.equal(3);
      expect(txMock.manyOrNone.calledWith(8)).to.equal(true);
    });
  });

  describe('handleUpdatedUser', function () {
    it('should not create any QIs if old user has first_logged_in_at value', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves([]);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(0);
    });

    it('should not create any QIs if new user has first_logged_in_at=null', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves([]);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(0);
    });

    it('should not create any QIs if user is not a proband', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Forscher',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Forscher',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves([]);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(0);
    });

    it('should not create any QIs if there are no questionnaires', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves([]);
      txMock.manyOrNone.onCall(1).resolves([]);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(2);
    });

    it('should create questionnaire instances', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves([]);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(3);
      expect(txMock.manyOrNone.calledWith(4)).to.equal(true);
    });

    it('should create questionnaire instances only for non conditional questionnaires', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const qConditions = [
        {
          questionnaire_id: 99999,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves(qConditions);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(3);
      expect(txMock.manyOrNone.calledWith(2)).to.equal(true);
    });

    it('should not create any questionnaire instances if all questionnaires are conditional', async function () {
      const user_old = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: null,
      };
      const user_new = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 1,
          cycle_unit: 'day',
          activate_after_days: 0,
          deactivate_after_days: 1,
        },
      ];

      const qConditions = [
        {
          questionnaire_id: 99999,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
        {
          questionnaire_id: 99998,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
      };

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      txMock.manyOrNone.onCall(0).resolves(questionnaires);
      txMock.manyOrNone.onCall(1).resolves(qConditions);
      txMock.manyOrNone.onCall(2).resolves([]);

      await sut.handleUpdatedUser(dbMock, user_old, user_new);

      expect(txMock.manyOrNone.callCount).to.equal(2);
    });
  });

  describe('handleUpdatedInstance', function () {
    it('should not do anything if no qCondition is defined for answer', async function () {
      const answer = {
        questionnaire_instance_id: 1,
        question_id: 1,
        answer_option_id: 1,
        value: 'Ja',
      };

      const txMock = {
        manyOrNone: sinon.stub(),
        many: sinon.stub(),
        one: sinon.stub(),
      };
      txMock.manyOrNone.onCall(0).resolves([]);

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      await sut.handleInsertedAnswer(dbMock, answer);

      expect(txMock.manyOrNone.callCount).to.equal(1);
      expect(txMock.many.callCount).to.equal(0);
      expect(txMock.one.callCount).to.equal(0);
    });

    it('should not do anything if no qCondition is met', async function () {
      const answer = {
        questionnaire_instance_id: 1,
        question_id: 1,
        answer_option_id: 1,
        value: 'Nein',
      };

      const user = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const qConditions = [
        {
          questionnaire_id: 99999,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
        {
          questionnaire_id: 99998,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '/=',
          condition_value: 'Nein',
        },
      ];

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
        many: sinon.stub().resolves(questionnaires),
        one: sinon.stub().resolves(user),
      };
      txMock.manyOrNone.onCall(0).resolves(qConditions);

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      await sut.handleInsertedAnswer(dbMock, answer);

      expect(txMock.manyOrNone.callCount).to.equal(1);
      expect(txMock.many.callCount).to.equal(1);
      expect(txMock.one.callCount).to.equal(1);
    });

    it('should only create qIs for met conditions', async function () {
      const answer = {
        questionnaire_instance_id: 1,
        question_id: 1,
        answer_option_id: 1,
        value: 'NotNein',
      };

      const user = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const qConditions = [
        {
          questionnaire_id: 99999,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
        {
          questionnaire_id: 99998,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '/=',
          condition_value: 'Nein',
        },
      ];

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
        many: sinon.stub().resolves(questionnaires),
        one: sinon.stub().resolves(user),
      };
      txMock.manyOrNone.onCall(0).resolves(qConditions);

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      await sut.handleInsertedAnswer(dbMock, answer);

      expect(txMock.manyOrNone.callCount).to.equal(2);
      expect(txMock.many.callCount).to.equal(1);
      expect(txMock.one.callCount).to.equal(1);
      expect(txMock.manyOrNone.calledWith(1)).to.equal(true);
    });

    it('should create qIs for all conditions if all conditions are met', async function () {
      const answer = {
        questionnaire_instance_id: 1,
        question_id: 1,
        answer_option_id: 1,
        value: 'Ja',
      };

      const user = {
        username: 'Testuser1',
        role: 'Proband',
        first_logged_in_at: new Date(Date.today()),
      };

      const qConditions = [
        {
          questionnaire_id: 99999,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '==',
          condition_value: 'Ja',
        },
        {
          questionnaire_id: 99998,
          condition_questionnaire_id: 1,
          condition_answer_option_id: 1,
          condition_operand: '/=',
          condition_value: 'Nein',
        },
      ];

      const questionnaires = [
        {
          id: 99999,
          study_id: 1,
          name: 'TestQuestionnaire1',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
        {
          id: 99998,
          study_id: 1,
          name: 'TestQuestionnaire2',
          no_questions: 2,
          cycle_amount: 0,
          cycle_unit: 'once',
          activate_after_days: 0,
          deactivate_after_days: 0,
        },
      ];

      const txMock = {
        manyOrNone: sinon.stub(),
        many: sinon.stub().resolves(questionnaires),
        one: sinon.stub().resolves(user),
      };
      txMock.manyOrNone.onCall(0).resolves(qConditions);

      const dbMock = {
        $config: {
          pgp: {
            helpers: {
              insert: function (dummy1) {
                return dummy1.length;
              },
              ColumnSet: class ColumnSet {},
            },
          },
        },
        tx: async function (callMe) {
          await callMe(txMock);
        },
      };

      await sut.handleInsertedAnswer(dbMock, answer);

      expect(txMock.manyOrNone.callCount).to.equal(2);
      expect(txMock.many.callCount).to.equal(1);
      expect(txMock.one.callCount).to.equal(1);
      expect(txMock.manyOrNone.calledWith(2)).to.equal(true);
    });
  });
});

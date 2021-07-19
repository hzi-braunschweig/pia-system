import chai from 'chai';
import { QuestionnaireHelper } from './questionnaireHelper';
import { Answer } from '../../../psa.app.web/src/app/psa.app.core/models/answer';
import { Condition } from '../models/Condition';

const expect = chai.expect;

const answer: Answer = {
  questionnaire_instance_id: 9999998,
  question_id: 99994,
  answer_option_id: 99995,
  versioning: 1,
  value: '13',
};

const condition: Condition = {
  condition_type: 'external',
  condition_question_id: 99993,
  condition_operand: '==',
  condition_value: '10',
  condition_target_answer_option: 99995,
  condition_target_questionnaire: 99998,
  condition_link: 'AND',
  condition_questionnaire_version: 1,
  condition_target_questionnaire_version: 1,

  condition_answer_option_id: 111,
  condition_questionnaire_id: 111,
  condition_target_question_pos: 111,
  condition_target_answer_option_pos: 111,
};

const answerTypeNumber = 3;
const answerTypeOther = 6;
const answerTypeDate = 5;

describe('questionnaireHelper', function () {
  let res: boolean;

  describe('isConditionMet', () => {
    describe("check condition link 'AND'", () => {
      it("check conditions with operand '=='", () => {
        condition.condition_link = 'AND';
        condition.condition_operand = '==';
        answer.value = '13';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '\\='", () => {
        condition.condition_operand = '\\=';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '>'", () => {
        condition.condition_operand = '>';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<'", () => {
        condition.condition_operand = '<';
        answer.value = '10';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });
      it("check conditions with operand '>='", () => {
        // operated >=
        condition.condition_operand = '>=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<='", () => {
        condition.condition_operand = '<=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it('check conditions with answer type date and multiple values', () => {
        condition.condition_link = 'AND';
        condition.condition_operand = '==';
        answer.value = '01.01.2000;02.01.2003';
        condition.condition_value = '01.01.2000;02.01.2003';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeDate
        );
        expect(res).to.equal(true);
      });

      it('check conditions with answer type date and multiple values (false condition)', () => {
        condition.condition_link = 'AND';
        condition.condition_operand = '==';
        answer.value = '01.01.2000;02.01.2003';
        condition.condition_value = '01.02.2000;02.01.2003';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeDate
        );
        expect(res).to.equal(false);
      });

      it("check conditions with operand '<=' (false case)", () => {
        condition.condition_operand = '<=';
        answer.value = '18';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(false);
      });

      it("check conditions with operand '>' (false case)", () => {
        condition.condition_operand = '>';
        answer.value = '18;19';
        condition.condition_value = '20;21';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(false);
      });
    });

    describe("check condition link 'OR'", () => {
      it("check conditions with operand '=='", () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '==';
        answer.value = '13';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '\\='", () => {
        condition.condition_link = 'OR';

        condition.condition_operand = '\\=';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '>'", () => {
        condition.condition_link = 'OR';

        condition.condition_operand = '>';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<'", () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '<';
        answer.value = '10';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '>='", () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '>=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<='", () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '<=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it('check conditions with text answers and multiple values', () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '==';
        answer.value = 'High;Mid;Low';
        condition.condition_value = 'High;Mid;Low';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeOther
        );
        expect(res).to.equal(true);
      });

      it('check conditions with text answers and multiple values (false condition)', () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '==';
        answer.value = 'High;Mid;Low';
        condition.condition_value = 'High1;Mid2;Low3';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeOther
        );
        expect(res).to.equal(false);
      });

      it("check conditions with operand '>' (false condition)", () => {
        condition.condition_link = 'OR';
        condition.condition_operand = '>';
        answer.value = '15;16';
        condition.condition_value = '16;17';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(false);
      });
    });

    describe("check condition link 'XOR'", () => {
      it("check conditions with operand '=='", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '==';
        answer.value = '13';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '\\='", () => {
        condition.condition_link = 'XOR';

        condition.condition_operand = '\\=';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '>'", () => {
        condition.condition_link = 'XOR';

        condition.condition_operand = '>';
        answer.value = '15';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<'", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '<';
        answer.value = '10';
        condition.condition_value = '13';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '>='", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '>=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<='", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '<=';
        answer.value = '15';
        condition.condition_value = '15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(true);
      });

      it("check conditions with operand '<=' (false condition)", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '<=';
        answer.value = '15;15';
        condition.condition_value = '12;12';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(false);
      });

      it("check conditions with operand '>' (false condition)", () => {
        condition.condition_link = 'XOR';
        condition.condition_operand = '>';
        answer.value = '12;12';
        condition.condition_value = '15;15';
        res = QuestionnaireHelper.isConditionMet(
          answer,
          condition,
          answerTypeNumber
        );
        expect(res).to.equal(false);
      });
    });
  });
});

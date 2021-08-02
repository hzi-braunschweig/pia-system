/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { ConditionChecker } from './conditionChecker';
import { Answer } from '../models/answer';
import { Condition, ConditionType } from '../models/condition';
import { AnswerType } from '../models/answerOption';

const baseAnswer: Answer = {
  questionnaire_instance_id: 9999998,
  question_id: 99994,
  answer_option_id: 99995,
  versioning: 1,
  value: '13',
};

const baseCondition: Condition = {
  id: 0,
  condition_operand: null,
  condition_value: null,
  condition_link: null,
  condition_type: ConditionType.EXTERNAL,

  condition_questionnaire_version: 1,
  condition_question_id: 99993,
  condition_answer_option_id: 111,
  condition_questionnaire_id: 111,

  condition_target_answer_option: 99995,
  condition_target_questionnaire: 99998,
  condition_target_questionnaire_version: 1,
};

describe('ConditionChecker', function () {
  describe('#isConditionMet', function () {
    describe("check condition link 'AND'", () => {
      it("check conditions with operand '=='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '13',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '\\='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '\\=',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '>'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '>',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '<',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '10',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });
      it("check conditions with operand '>='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '>=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '<=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it('check conditions with answer type date and multiple values', () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: '01.01.2000;02.01.2003',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '01.01.2000;02.01.2003',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Date
        );
        expect(result).to.be.true;
      });

      it('check conditions with answer type date and multiple values (false condition)', () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: '01.02.2000;02.01.2003',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '01.01.2000;02.01.2003',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Date
        );
        expect(result).to.be.false;
      });

      it("check conditions with operand '<=' (false case)", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '<=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '18',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.false;
      });

      it("check conditions with operand '>' (false case)", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '>',
          condition_value: '20;21',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '18;19',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.false;
      });

      it('1 answer value, 3 condition values, operand ===, AND link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.false;
      });

      it('3 answer values, 3 condition values, operand ===, AND link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1;ans2;ans3',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.true;
      });

      it('3 answer values, 3 condition values, operand ===, AND link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1;ans2;ans4',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'AND',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.false;
      });
    });

    describe("check condition link 'OR'", () => {
      it("check conditions with operand '=='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '13',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '\\='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '\\=',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '>'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '>',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '<',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '10',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '>='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '>=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '<=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it('check conditions with text answers and multiple values', () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'High;Mid;Low',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: 'High;Mid;Low',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );
        expect(result).to.be.true;
      });

      it('check conditions with text answers and multiple values (false condition)', () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'High1;Mid2;Low3',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: 'High;Mid;Low',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );
        expect(result).to.be.false;
      });

      it("check conditions with operand '>' (false condition)", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '>',
          condition_value: '16;17',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15;16',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.false;
      });
      it('1 answer value, 1 condition value, operand ===, OR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'Ja',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'Ja',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.true;
      });

      it('1 answer value, 1 condition value, operand ===, OR link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'Ja',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'Nein',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.false;
      });

      it('3 answer values, 1 condition value, operand ===, OR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1;ans2;ans3',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'ans2',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.true;
      });

      it('3 answer values, 1 condition value, operand ===, OR link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1;ans2;ans3',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'ans4',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.false;
      });

      it('1 answer value, 3 condition values, operand ===, OR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.true;
      });

      it('1 answer value, 3 condition values, operand ===, OR link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'ans2;ans3;ans4',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.false;
      });

      it('3 answer values, 3 condition values, operand ===, OR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans2;ans4;ans5',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.true;
      });

      it('3 answer values, 3 condition values, operand ===, OR link, negative example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans4;ans5;ans6',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.false;
      });
    });

    describe("check condition link 'XOR'", () => {
      it("check conditions with operand '=='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '13',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '\\='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '\\=',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '>'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '>',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<'", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '<',
          condition_value: '13',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '10',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '>='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '>=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<='", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '<=',
          condition_value: '15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.true;
      });

      it("check conditions with operand '<=' (false condition)", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '<=',
          condition_value: '12;12',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '15;15',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.false;
      });

      it("check conditions with operand '>' (false condition)", () => {
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '>',
          condition_value: '15;15',
        };
        const answer: Answer = {
          ...baseAnswer,
          value: '12;12',
        };
        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );
        expect(result).to.be.false;
      });

      it('1 answer value, 3 condition values, operand ===, XOR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.SingleSelect
        );

        expect(result).to.be.true;
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, positive example', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans0;ans2;ans5',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.true;
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans1;ans2;ans4',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.false;
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans4;ans5;ans6',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.false;
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: 'ans0;ans2;ans5;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'XOR',
          condition_operand: '==',
          condition_value: 'ans1;ans2;ans3;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.MultiSelect
        );

        expect(result).to.be.true;
      });
    });
    describe('check condition for AnswerType.Number', () => {
      it('test for == 0 condition when answer != 0', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: '1;2;3;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '0;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );

        expect(result).to.be.false;
      });

      it('test for == 0 condition when answer == 0', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: '1;0;3;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '0;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );

        expect(result).to.be.true;
      });

      it('test for == 1 condition when answer == 1.5', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: '2;3;1.5;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '1;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );

        expect(result).to.be.false;
      });

      it('test for == 1.5 condition when answer == 1.5', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: '2;3;1.5;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '1.5;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );

        expect(result).to.be.true;
      });

      it('test for == 1.5 condition when answer != 1.5', function () {
        const answer: Answer = {
          ...baseAnswer,
          value: '2;3;1;',
        };
        const condition: Condition = {
          ...baseCondition,
          condition_link: 'OR',
          condition_operand: '==',
          condition_value: '1.5;',
        };

        const result = ConditionChecker.isConditionMet(
          answer,
          condition,
          AnswerType.Number
        );

        expect(result).to.be.false;
      });
    });
  });
});

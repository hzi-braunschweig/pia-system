/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox } from 'sinon';
import chai, { expect } from 'chai';
import { addDays, startOfToday, subDays } from 'date-fns';
import { Answer } from '../models/answer';
import { Condition } from '../models/condition';
import sinonChai from 'sinon-chai';
import { ConditionsService } from './conditionsService';

chai.use(sinonChai);

const sandbox = createSandbox();

/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('conditionsService', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('isConditionMet', () => {
    it('answer is undefined', () => {
      const answer = undefined;
      const condition = createCondition({
        condition_value: 'Ja',
        condition_operand: '==',
      });
      const actual = ConditionsService.isConditionMet(answer, condition, 1);

      expect(actual).to.equal(false);
    });

    context('no link defaults to OR', () => {
      it('1 answer value, 1 condition value, operand ===, no link, positive example', () => {
        const answer = createAnswer('Ja');
        const condition = createCondition({
          condition_value: 'Ja',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition value, operand ===, no link, negative example', () => {
        const answer = createAnswer('Ja');
        const condition = createCondition({
          condition_value: 'Nein',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 1 condition value, operand ===, no link, positive example', () => {
        const answer = createAnswer('ans1;ans2;ans3');
        const condition = createCondition({
          condition_value: 'ans2',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 1 condition value, operand ===, no link, negative example', () => {
        const answer = createAnswer('ans1;ans2;ans3');
        const condition = createCondition({
          condition_value: 'ans4',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand ===, no link, positive example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand ===, no link, negative example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans2;ans3;ans4',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 3 condition values, operand ===, no link, positive example', () => {
        const answer = createAnswer('ans2;ans4;ans5');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 3 condition values, operand ===, no link, negative example', () => {
        const answer = createAnswer('ans4;ans5;ans6');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });
    });

    context('OR', () => {
      it('1 answer value, 3 condition values, operand ===, OR link, positive example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand ===, OR link, negative example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans2;ans3;ans4',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 3 condition values, operand ===, OR link, positive example', () => {
        const answer = createAnswer('ans2;ans4;ans5');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 3 condition values, operand ===, OR link, negative example', () => {
        const answer = createAnswer('ans4;ans5;ans6');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand ===, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand ===, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '==',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand <, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '<',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '>',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '>',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand <=, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <=, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '<=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >=, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '13',
          condition_operand: '>=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >=, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '>=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand \\=, OR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '\\=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand \\=, OR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '11',
          condition_operand: '\\=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });
    });

    context('AND', () => {
      it('1 answer value, 1 condition values, operand <, AND link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <, AND link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '<',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >, AND link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '>',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >, AND link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '>',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand <=, AND link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<=',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <=, AND link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '<=',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >=, AND link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '13',
          condition_operand: '>=',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >=, AND link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '>=',
          condition_link: 'OR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand \\=, AND link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '\\=',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand \\=, AND link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '11',
          condition_operand: '\\=',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand ===, AND link, negative example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 3 condition values, operand ===, AND link, positive example', () => {
        const answer = createAnswer('ans1;ans2;ans3');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 3 condition values, operand ===, AND link, negative example', () => {
        const answer = createAnswer('ans1;ans2;ans4');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'AND',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });
    });

    context('XOR', () => {
      it('1 answer value, 1 condition values, operand <, XOR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <, XOR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '<',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >, XOR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '22',
          condition_operand: '>',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >, XOR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '>',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand <=, XOR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '8',
          condition_operand: '<=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand <=, XOR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '<=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand >=, XOR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '13',
          condition_operand: '>=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand >=, XOR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '>=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 1 condition values, operand \\=, XOR link, number, negative example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '12',
          condition_operand: '\\=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 1 condition values, operand \\=, XOR link, number, positive example', () => {
        const answer = createAnswer('12');
        const condition = createCondition({
          condition_value: '11',
          condition_operand: '\\=',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 3);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand ===, XOR link, positive example', () => {
        const answer = createAnswer('ans1');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, positive example', () => {
        const answer = createAnswer('ans0;ans2;ans5');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', () => {
        const answer = createAnswer('ans1;ans2;ans4');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', () => {
        const answer = createAnswer('ans4;ans5;ans6');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3',
          condition_operand: '==',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(false);
      });

      it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', () => {
        const answer = createAnswer('ans0;ans2;ans5;');
        const condition = createCondition({
          condition_value: 'ans1;ans2;ans3;',
          condition_operand: '==',
          condition_link: 'XOR',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 1);

        expect(actual).to.equal(true);
      });
    });

    context('Date', () => {
      it('1 answer value, 3 condition values, operand ==, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: addDays(startOfToday(), 1).toDateString(),
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand ==, date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '==',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand <, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '<',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand < date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: addDays(startOfToday(), 1).toDateString(),
          condition_operand: '<',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand >, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '>',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand > date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: subDays(startOfToday(), 1).toDateString(),
          condition_operand: '>',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand <=, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: subDays(startOfToday(), 1).toDateString(),
          condition_operand: '<=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand <= date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '<=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand >=, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: addDays(startOfToday(), 1).toDateString(),
          condition_operand: '>=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand >= date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '>=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });

      it('1 answer value, 3 condition values, operand \\=, date, negative example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: startOfToday().toDateString(),
          condition_operand: '\\=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(false);
      });

      it('1 answer value, 3 condition values, operand \\= date, positive example', () => {
        const answer = createAnswer(startOfToday().toDateString());
        const condition = createCondition({
          condition_value: addDays(startOfToday(), 1).toDateString(),
          condition_operand: '\\=',
        });

        const actual = ConditionsService.isConditionMet(answer, condition, 5);

        expect(actual).to.equal(true);
      });
    });
  });

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
});

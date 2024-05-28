/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { AnswerOption } from '../entities/answerOption';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { AnswerType } from '../models/answerOption';
import { AnswerService } from './answerService';

describe('AnswerService', () => {
  context('encodeAnswerValue', () => {
    const choiceValueMap = new Map<number, string>([
      [-1, 'No Answer'],
      [0, 'Yes'],
      [1, 'No'],
      [2, 'Very much so'],
      [3, '100% correct'],
    ]);

    context('single select values', () => {
      const answerOption: Pick<
        AnswerOption,
        'answerTypeId' | 'values' | 'valuesCode'
      > = {
        answerTypeId: AnswerType.SingleSelect,
        values: Array.from(choiceValueMap.values()),
        valuesCode: Array.from(choiceValueMap.keys()),
      };

      const testCases = [...choiceValueMap.entries()];

      for (const [code, value] of testCases) {
        it(`should encode "${code}" to "${value}"`, async () => {
          expect(
            await AnswerService.encodeAnswerValue(
              {} as QuestionnaireInstance,
              answerOption as AnswerOption,
              code
            )
          ).to.eq(value);
        });
      }
    });

    context('multi select values', () => {
      const answerOption: Pick<
        AnswerOption,
        'answerTypeId' | 'values' | 'valuesCode'
      > = {
        answerTypeId: AnswerType.MultiSelect,
        values: Array.from(choiceValueMap.values()),
        valuesCode: Array.from(choiceValueMap.keys()),
      };

      const testCases: [number[], string][] = [
        [[-1, 2], 'No Answer;Very much so'],
        [[0, 1, 3], 'Yes;No;100% correct'],
      ];

      for (const [code, value] of testCases) {
        it(`should encode "${code.join('", "')}" to "${value}"`, async () => {
          expect(
            await AnswerService.encodeAnswerValue(
              {} as QuestionnaireInstance,
              answerOption as AnswerOption,
              code
            )
          ).to.eq(value);
        });
      }
    });
  });

  context('decodeAnswerValue', () => {
    const choiceValueMap = new Map<number, string>([
      [-1, 'No Answer'],
      [0, 'Yes'],
      [1, 'No'],
      [2, 'Very much so'],
      [3, '100% correct'],
    ]);

    context('single select values', () => {
      const answerOption: Pick<
        AnswerOption,
        'answerTypeId' | 'values' | 'valuesCode'
      > = {
        answerTypeId: AnswerType.SingleSelect,
        values: Array.from(choiceValueMap.values()),
        valuesCode: Array.from(choiceValueMap.keys()),
      };

      const testCases = [...choiceValueMap.entries()];

      for (const [code, value] of testCases) {
        it(`should decode "${value}" to "${code}"`, async () => {
          expect(
            await AnswerService.decodeAnswerValue(
              answerOption as AnswerOption,
              value
            )
          ).to.eq(code);
        });
      }
    });

    context('multi select values', () => {
      const answerOption: Pick<
        AnswerOption,
        'answerTypeId' | 'values' | 'valuesCode'
      > = {
        answerTypeId: AnswerType.MultiSelect,
        values: Array.from(choiceValueMap.values()),
        valuesCode: Array.from(choiceValueMap.keys()),
      };

      const testCases: [number[], string][] = [
        [[-1, 2], 'No Answer;Very much so'],
        [[0, 1, 3], 'Yes;No;100% correct'],
      ];

      for (const [code, value] of testCases) {
        it(`should decode "${value}" to "${code.join('", "')}"`, async () => {
          expect(
            await AnswerService.decodeAnswerValue(
              answerOption as AnswerOption,
              value
            )
          ).to.deep.eq(code);
        });
      }
    });
  });
});

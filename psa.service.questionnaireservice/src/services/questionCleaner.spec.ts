/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { ConditionType } from '../models/condition';
import { Question } from '../entities/question';
import { QuestionCleaner } from './questionCleaner';

describe('QuestionCleaner', () => {
  describe('#getQuestionsToAdd', function () {
    it('should return an empty array if all answerOptions conditions point to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          answerOptions: [
            {
              id: 1,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
            {
              id: 2,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
          ],
        },
        {
          id: 2,
          answerOptions: [
            {
              id: 3,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
            {
              id: 4,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd();

      expect(actual).to.have.length(0);
    });

    it('should return an empty array if all answerOptions conditions point recursively to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          answerOptions: [
            {
              id: 1,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
            {
              id: 2,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 1 },
              },
            },
          ],
        },
        {
          id: 2,
          answerOptions: [
            {
              id: 3,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 4 },
              },
            },
            {
              id: 4,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 2 },
              },
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd();

      expect(actual).to.have.length(0);
    });

    it('should return an empty array if all questions conditions point to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 5 },
          },
          answerOptions: [
            {
              id: 1,
            },
            {
              id: 2,
            },
          ],
        },

        {
          id: 2,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 5 },
          },
          answerOptions: [
            {
              id: 3,
            },
            {
              id: 4,
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd();

      expect(actual).to.have.length(0);
    });

    it('should return an empty array if all questions conditions point recursevly to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 10 },
          },
          answerOptions: [
            {
              id: 1,
            },
            {
              id: 2,
            },
          ],
        },
        {
          id: 2,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 1 },
          },
          answerOptions: [
            {
              id: 3,
            },
            {
              id: 4,
            },
          ],
        },
        {
          id: 3,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 4 },
          },
          answerOptions: [
            {
              id: 5,
            },
            {
              id: 6,
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd();

      expect(actual).to.have.length(0);
    });

    it('should return an empty array if a complex mix of internal conditions demands it', function () {
      const questions = [
        {
          id: 1,
          answerOptions: [
            {
              id: 1,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 10 },
              },
            },
            {
              id: 2,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 3 },
              },
            },
          ],
        },
        {
          id: 2,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 10 },
          },
          answerOptions: [
            {
              id: 3,
            },
            {
              id: 4,
            },
          ],
        },
        {
          id: 3,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 2 },
          },
          answerOptions: [
            {
              id: 5,
            },
            {
              id: 6,
            },
          ],
        },
        {
          id: 4,
          answerOptions: [
            {
              id: 7,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
            {
              id: 8,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 6 },
              },
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd();

      expect(actual).to.have.length(0);
    });

    it('should return the question with one answer option that is non conditional', function () {
      const questions = [
        {
          id: 1,
          answerOptions: [
            {
              id: 1,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 5 },
              },
            },
            {
              id: 2,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 1 },
              },
            },
          ],
        },
        {
          id: 2,
          answerOptions: [
            {
              id: 3,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 2 },
              },
            },
            {
              id: 4,
              condition: {
                type: ConditionType.EXTERNAL,
                targetAnswerOption: { id: 999 },
              },
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd()!;

      expect(actual).to.have.length(1);
      expect(actual[0]!.id).to.equal(2);
      expect(actual[0]!.answerOptions).to.have.length(1);
      expect(actual[0]!.answerOptions![0]!.id).to.equal(4);
    });

    it('should return correct questions with correct answerOptions filtered out of a complex mix of internal conditions', function () {
      const questions = [
        {
          id: 1,
          answerOptions: [
            {
              id: 1,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 999 },
              },
            },
            {
              id: 2,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 3 },
              },
            },
          ],
        },
        {
          id: 2,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 999 },
          },
          answerOptions: [
            {
              id: 3,
            },
            {
              id: 4,
            },
          ],
        },
        {
          id: 3,
          condition: {
            type: ConditionType.INTERNAL_THIS,
            targetAnswerOption: { id: 2 },
          },
          answerOptions: [
            {
              id: 5,
            },
            {
              id: 6,
            },
          ],
        },
        {
          id: 4,
          answerOptions: [
            {
              id: 7,
            },
            {
              id: 8,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 6 },
              },
            },
          ],
        },
        {
          id: 5,
          answerOptions: [
            {
              id: 9,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 7 },
              },
            },
            {
              id: 10,
              condition: {
                type: ConditionType.INTERNAL_THIS,
                targetAnswerOption: { id: 9 },
              },
            },
          ],
        },
      ];

      const actual = new QuestionCleaner(
        questions as Question[]
      ).getQuestionsToAdd()!;

      expect(actual).to.have.length(2);
      expect(actual[0]!.id).to.equal(4);
      expect(actual[1]!.id).to.equal(5);
      expect(actual[0]!.answerOptions).to.have.length(1);
      expect(actual[0]!.answerOptions![0]!.id).to.equal(7);
      expect(actual[1]!.answerOptions).to.have.length(2);
      expect(actual[1]!.answerOptions![0]!.id).to.equal(9);
      expect(actual[1]!.answerOptions![1]!.id).to.equal(10);
    });
  });
});

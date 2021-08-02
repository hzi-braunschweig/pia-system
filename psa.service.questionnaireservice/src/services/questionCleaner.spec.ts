/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers,@typescript-eslint/no-non-null-assertion */
import { expect } from 'chai';
import { QuestionCleaner } from './questionCleaner';
import { ConditionType } from '../models/condition';
import { Question } from '../models/question';

describe('QuestionCleaner', () => {
  describe('#getQuestionsToAdd', function () {
    it('should return an empty array if all answer_options conditions point to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          answer_options: [
            {
              id: 1,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
            {
              id: 2,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
          ],
        },
        {
          id: 2,
          answer_options: [
            {
              id: 3,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
            {
              id: 4,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
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

    it('should return an empty array if all answer_options conditions point recursively to missing internal answer_option', function () {
      const questions = [
        {
          id: 1,
          answer_options: [
            {
              id: 1,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
            {
              id: 2,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 1,
              },
            },
          ],
        },
        {
          id: 2,
          answer_options: [
            {
              id: 3,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 4,
              },
            },
            {
              id: 4,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 2,
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 5,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 5,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 10,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 1,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 4,
          },
          answer_options: [
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
          answer_options: [
            {
              id: 1,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 10,
              },
            },
            {
              id: 2,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 3,
              },
            },
          ],
        },
        {
          id: 2,
          condition: {
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 10,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 2,
          },
          answer_options: [
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
          answer_options: [
            {
              id: 7,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
            {
              id: 8,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 6,
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
          answer_options: [
            {
              id: 1,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 5,
              },
            },
            {
              id: 2,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 1,
              },
            },
          ],
        },
        {
          id: 2,
          answer_options: [
            {
              id: 3,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 2,
              },
            },
            {
              id: 4,
              condition: {
                condition_type: ConditionType.EXTERNAL,
                condition_target_answer_option: 999,
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
      expect(actual[0]!.answer_options).to.have.length(1);
      expect(actual[0]!.answer_options[0]!.id).to.equal(4);
    });

    it('should return correct questions with correct answer_options filtered out of a complex mix of internal conditions', function () {
      const questions = [
        {
          id: 1,
          answer_options: [
            {
              id: 1,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 999,
              },
            },
            {
              id: 2,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 3,
              },
            },
          ],
        },
        {
          id: 2,
          condition: {
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 999,
          },
          answer_options: [
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
            condition_type: ConditionType.INTERNAL_THIS,
            condition_target_answer_option: 2,
          },
          answer_options: [
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
          answer_options: [
            {
              id: 7,
            },
            {
              id: 8,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 6,
              },
            },
          ],
        },
        {
          id: 5,
          answer_options: [
            {
              id: 9,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 7,
              },
            },
            {
              id: 10,
              condition: {
                condition_type: ConditionType.INTERNAL_THIS,
                condition_target_answer_option: 9,
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
      expect(actual[0]!.answer_options).to.have.length(1);
      expect(actual[0]!.answer_options[0]!.id).to.equal(7);
      expect(actual[1]!.answer_options).to.have.length(2);
      expect(actual[1]!.answer_options[0]!.id).to.equal(9);
      expect(actual[1]!.answer_options[1]!.id).to.equal(10);
    });
  });
});

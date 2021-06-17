const expect = require('chai').expect;

const conditionCheckerService = require('./conditionCheckerService');

describe('conditionCheckerService', function () {
  describe('#isConditionMet', function () {
    it('1 answer value, 1 condition value, operand ===, no link, positive example', function () {
      const answer = { value: 'Ja' };
      const condition = { condition_value: 'Ja', condition_operand: '==' };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition value, operand ===, no link, negative example', function () {
      const answer = { value: 'Ja' };
      const condition = { condition_value: 'Nein', condition_operand: '==' };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 1 condition value, operand ===, no link, positive example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = { condition_value: 'ans2', condition_operand: '==' };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 1 condition value, operand ===, no link, negative example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = { condition_value: 'ans4', condition_operand: '==' };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, no link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, no link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = { value: 'ans1' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, positive example', function () {
      const answer = { value: 'ans2;ans4;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, negative example', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = { value: 'ans2;ans4;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, positive example', function () {
      const answer = { value: 'ans1;ans2;ans3' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = { value: 'ans1;ans2;ans4' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = { value: 'ans0;ans2;ans5' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', function () {
      const answer = { value: 'ans1;ans2;ans4' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', function () {
      const answer = { value: 'ans4;ans5;ans6' };
      const condition = {
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', function () {
      const answer = { value: 'ans0;ans2;ans5;' };
      const condition = {
        condition_value: 'ans1;ans2;ans3;',
        condition_operand: '==',
        condition_link: 'XOR',
      };

      const actual = conditionCheckerService.isConditionMet(answer, condition);

      expect(actual).to.equal(true);
    });

    it('test for == 0 condition when answer != 0', function () {
      const answer = { value: '1;2;3;' };
      const condition = {
        condition_value: '0;',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('test for == 0 condition when answer == 0', function () {
      const answer = { value: '1;0;3;' };
      const condition = {
        condition_value: '0;',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('test for == 1 condition when answer == 1.5', function () {
      const answer = { value: '2;3;1.5;' };
      const condition = {
        condition_value: '1;',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('test for == 1.5 condition when answer == 1.5', function () {
      const answer = { value: '2;3;1.5;' };
      const condition = {
        condition_value: '1.5;',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('test for == 1.5 condition when answer != 1.5', function () {
      const answer = { value: '2;3;1;' };
      const condition = {
        condition_value: '1.5;',
        condition_operand: '==',
        condition_link: 'OR',
      };

      const actual = conditionCheckerService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });
  });

  describe('#filterInternalConditions', function () {
    it('should return null if all answer_options conditions point to missing internal answer_option', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            answer_options: [
              {
                id: 1,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
              {
                id: 2,
                condition: {
                  condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
              {
                id: 4,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
            ],
          },
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual).to.not.be.ok;
    });

    it('should return null if all answer_options conditions point recursively to missing internal answer_option', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            answer_options: [
              {
                id: 1,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
              {
                id: 2,
                condition: {
                  condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
                  condition_target_answer_option: 4,
                },
              },
              {
                id: 4,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 2,
                },
              },
            ],
          },
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual).to.not.be.ok;
    });

    it('should return null if all questions conditions point to missing internal answer_option', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            condition: {
              condition_type: 'internal_this',
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
              condition_type: 'internal_this',
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
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual).to.not.be.ok;
    });

    it('should return null if all questions conditions point recursevly to missing internal answer_option', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            condition: {
              condition_type: 'internal_this',
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
              condition_type: 'internal_this',
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
              condition_type: 'internal_this',
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
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual).to.not.be.ok;
    });

    it('should return null if a complex mix of internal conditions demands it', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            answer_options: [
              {
                id: 1,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 10,
                },
              },
              {
                id: 2,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 3,
                },
              },
            ],
          },
          {
            id: 2,
            condition: {
              condition_type: 'internal_this',
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
              condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
              {
                id: 8,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 6,
                },
              },
            ],
          },
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual).to.not.be.ok;
    });

    it('should return the question with one answer option that is non conditional', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            answer_options: [
              {
                id: 1,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 5,
                },
              },
              {
                id: 2,
                condition: {
                  condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
                  condition_target_answer_option: 2,
                },
              },
              {
                id: 4,
                condition: {
                  condition_type: 'external',
                  condition_target_answer_option: 999,
                },
              },
            ],
          },
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual.questions.length).to.equal(1);
      expect(actual.questions[0].id).to.equal(2);
      expect(actual.questions[0].answer_options.length).to.equal(1);
      expect(actual.questions[0].answer_options[0].id).to.equal(4);
    });

    it('should return correct questions with correct answer_options filtered out of a complex mix of internal conditions', function () {
      const questionnaire = {
        questions: [
          {
            id: 1,
            answer_options: [
              {
                id: 1,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 999,
                },
              },
              {
                id: 2,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 3,
                },
              },
            ],
          },
          {
            id: 2,
            condition: {
              condition_type: 'internal_this',
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
              condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
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
                  condition_type: 'internal_this',
                  condition_target_answer_option: 7,
                },
              },
              {
                id: 10,
                condition: {
                  condition_type: 'internal_this',
                  condition_target_answer_option: 9,
                },
              },
            ],
          },
        ],
      };

      const actual =
        conditionCheckerService.filterInternalConditions(questionnaire);

      expect(actual.questions.length).to.equal(2);
      expect(actual.questions[0].id).to.equal(4);
      expect(actual.questions[1].id).to.equal(5);
      expect(actual.questions[0].answer_options.length).to.equal(1);
      expect(actual.questions[0].answer_options[0].id).to.equal(7);
      expect(actual.questions[1].answer_options.length).to.equal(2);
      expect(actual.questions[1].answer_options[0].id).to.equal(9);
      expect(actual.questions[1].answer_options[1].id).to.equal(10);
    });
  });
});

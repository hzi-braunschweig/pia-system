import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { RequiredAnswerValidator } from './required-answer-validator';

describe('RequiredAnswerValidator', () => {
  describe('unit test', () => {
    const validatorFn = RequiredAnswerValidator.answerRequired;

    it('should return an error if a required answer has an empty string value', () => {
      const control = createMinimalForm('');

      expect(validatorFn(control)).toEqual({ answerRequired: true });
    });

    it('should return an error if a required answer has value of null', () => {
      const control = createMinimalForm(null);

      expect(validatorFn(control)).toEqual({ answerRequired: true });
    });

    it('should return an error if a required answer has value of undefined', () => {
      const control = createMinimalForm(undefined);

      expect(validatorFn(control)).toEqual({ answerRequired: true });
    });

    it('should return no error if a required answer has a value', () => {
      const control = createMinimalForm('Ja;');

      expect(validatorFn(control)).toEqual(null);
    });

    it('should return no error if a required answer has a value of false', () => {
      const control = createMinimalForm(false);

      expect(validatorFn(control)).toEqual(null);
    });

    function createMinimalForm(value): FormGroup {
      return new FormGroup({
        show_answer_option: new FormControl(true),
        value: new FormControl(value),
      });
    }
  });

  /**
   * This test shows an example of an actual FormGroup as it
   * may be existing within {@link QuestionProbandComponent}.
   *
   * Obviously this test doesn't provide any further test safety,
   * as we only test the correct integration with Angular Forms,
   * which should work as expected.
   */
  describe('integration test', () => {
    it('should set the form group invalid', () => {
      const questionnaireForm = createQuestionnaireForm();
      expect(questionnaireForm.valid).toBeTruthy();

      const answer1FormGroup = (
        (questionnaireForm.get('questions') as FormArray)
          .at(0)
          .get('answer_options') as FormArray
      ).at(0);
      answer1FormGroup.get('value').setValue('');

      expect(questionnaireForm.valid).toBeFalsy();
    });

    function createQuestionnaireForm(): FormGroup {
      return new FormGroup({
        name: new FormControl('PIA_558_reproduktion'),
        questions: new FormArray([
          new FormGroup({
            id: new FormControl(1),
            text: new FormControl('F1 = Ja -> F2, F1 = Nein -> F3'),
            is_mandatory: new FormControl(true),
            show_question: new FormControl(true),
            show_question_answer_condition: new FormControl(true),
            counterOfDisabledAnswerOptionsInQuestion: new FormControl(0),
            answer_options: new FormArray([
              new FormGroup(
                {
                  text: new FormControl('Wenn ja, dann F2. Wenn Nein, dann F3'),
                  id: new FormControl(74),
                  question_id: new FormControl(19),
                  answer_type_id: new FormControl(2),
                  show_answer_option: new FormControl(true),
                  is_condition_target: new FormControl(true),
                  value: new FormControl('Ja;'),
                  values: new FormArray([]),
                  hasValue: new FormControl(false),
                },
                RequiredAnswerValidator.answerRequired
              ),
              new FormGroup(
                {
                  text: new FormControl('Weil F1 Ja'),
                  id: new FormControl(75),
                  question_id: new FormControl(19),
                  answer_type_id: new FormControl(2),
                  show_answer_option: new FormControl(true),
                  is_condition_target: new FormControl(false),
                  value: new FormControl('some value'),
                  values: new FormArray([]),
                  hasValue: new FormControl(false),
                  condition: new FormGroup({
                    condition_type: new FormControl('internal_this'),
                    condition_target_questionnaire: new FormControl(5),
                    condition_target_answer_option: new FormControl(74),
                    condition_question_id: new FormControl(null),
                    condition_operand: new FormControl('=='),
                    condition_value: new FormControl('Ja'),
                  }),
                },
                RequiredAnswerValidator.answerRequired
              ),
              new FormGroup(
                {
                  text: new FormControl('Weil F1 Nein'),
                  id: new FormControl(76),
                  question_id: new FormControl(19),
                  answer_type_id: new FormControl(4),
                  show_answer_option: new FormControl(false),
                  is_condition_target: new FormControl(false),
                  value: new FormControl('gkuz'),
                  values: new FormArray([]),
                  hasValue: new FormControl(false),
                  condition: new FormGroup({
                    condition_type: new FormControl('internal_this'),
                    condition_target_questionnaire: new FormControl(5),
                    condition_target_answer_option: new FormControl(74),
                    condition_question_id: new FormControl(null),
                    condition_operand: new FormControl('=='),
                    condition_value: new FormControl('Nein'),
                  }),
                },
                RequiredAnswerValidator.answerRequired
              ),
            ]),
          }),
        ]),
      });
    }
  });
});

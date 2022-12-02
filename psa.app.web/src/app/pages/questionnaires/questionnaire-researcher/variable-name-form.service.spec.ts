/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { VariableNameFormService } from './variable-name-form.service';
import {
  AnswerOptionForm,
  AnswerOptionValueForm,
  QuestionForm,
  QuestionnaireForm,
} from './questionnaire-form';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { AnswerType } from '../../../psa.app.core/models/answerType';

describe('VariableNameFormService', () => {
  let questionnaireForm: FormGroup<Partial<QuestionnaireForm>>;
  let questionForm: FormGroup<Partial<QuestionForm>>;
  let answerOptionForm: FormGroup<Partial<AnswerOptionForm>>;
  let answerOptionValueForms: FormArray<
    FormGroup<Partial<AnswerOptionValueForm>>
  >;
  let service: VariableNameFormService;
  let warnings: Set<FormControl<unknown>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [VariableNameFormService] });
    service = TestBed.inject(VariableNameFormService);

    warnings = new Set();
    answerOptionValueForms = new FormArray([
      new FormGroup<Partial<AnswerOptionValueForm>>({
        value: new FormControl(),
      }),
      new FormGroup<Partial<AnswerOptionValueForm>>({
        value: new FormControl(),
      }),
    ]);
    answerOptionForm = new FormGroup<Partial<AnswerOptionForm>>({
      answer_type_id: new FormControl(),
      text: new FormControl(),
      variable_name: new FormControl(),
      values: answerOptionValueForms as unknown as FormArray<
        FormGroup<AnswerOptionValueForm>
      >,
    });
    questionForm = new FormGroup<Partial<QuestionForm>>({
      text: new FormControl(),
      variable_name: new FormControl(),
      answer_options: new FormArray([answerOptionForm]) as unknown as FormArray<
        FormGroup<AnswerOptionForm>
      >,
    });

    questionnaireForm = new FormGroup<Partial<QuestionnaireForm>>({
      questions: new FormArray([questionForm]) as unknown as FormArray<
        FormGroup<QuestionForm>
      >,
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('warnings for existing questionnaire with labels', () => {
    let currentQuestionnaire: Partial<Questionnaire>;
    beforeEach(() => {
      currentQuestionnaire = {
        questions: [
          {
            variable_name: 'auto-123',
            text: 'Question',
            answer_options: [
              {
                answer_type_id: AnswerType.MultiSelect,
                variable_name: 'auto-123',
                text: 'Answer Option',
                values: ['A', 'B'],
              },
            ],
          },
        ],
      } as Questionnaire;
      setQuestionnaireValuesOnForm(currentQuestionnaire);

      service.initVariableNameWarning(
        questionnaireForm as unknown as FormGroup<QuestionnaireForm>,
        currentQuestionnaire as unknown as Questionnaire,
        warnings
      );
    });

    it('should add warnings for question variable name', () => {
      setQuestionForms({ questionText: 'Some Text' });

      expect(warnings.has(questionForm.controls.variable_name)).toBeTruthy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });

    it('should add warnings for answer option variable name when text changes', () => {
      setQuestionForms({ answerOptionText: 'Some Text' });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(
        warnings.has(answerOptionForm.controls.variable_name)
      ).toBeTruthy();
    });

    it('should add warnings for answer option variable name when values changes', () => {
      setQuestionForms({ answerOptionValueTexts: ['C', 'D'] });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(
        warnings.has(answerOptionForm.controls.variable_name)
      ).toBeTruthy();
    });

    it('should add warnings for answer option variable name when answer type id changes', () => {
      setQuestionForms({ answerTypeId: AnswerType.Text });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(
        warnings.has(answerOptionForm.controls.variable_name)
      ).toBeTruthy();
    });

    it('should add warnings for question and answer option variable name', () => {
      setQuestionForms({
        questionText: 'Some Text',
        answerOptionText: 'Some Text',
      });

      expect(warnings.has(questionForm.controls.variable_name)).toBeTruthy();
      expect(
        warnings.has(answerOptionForm.controls.variable_name)
      ).toBeTruthy();
    });

    it('should remove warnings when change is reverted', () => {
      setQuestionForms({
        questionText: 'Some Text',
        answerOptionText: 'Some Text',
        answerTypeId: AnswerType.Text,
      });
      setQuestionnaireValuesOnForm(currentQuestionnaire);

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });

    it('should remove warnings for answer option when changes are reverted', () => {
      setQuestionForms({ answerOptionValueTexts: ['C', 'D'] });
      setQuestionnaireValuesOnForm(currentQuestionnaire);

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });
  });

  describe('warnings for existing questionnaire without labels', () => {
    beforeEach(() => {
      const currentQuestionnaire: Partial<Questionnaire> = {
        questions: [
          {
            variable_name: '',
            text: 'Question',
            answer_options: [
              {
                answer_type_id: AnswerType.MultiSelect,
                variable_name: '',
                text: 'Answer Option',
                values: ['A', 'B'],
              },
            ],
          },
        ],
      } as Questionnaire;

      setQuestionnaireValuesOnForm(currentQuestionnaire);

      service.initVariableNameWarning(
        questionnaireForm as unknown as FormGroup<QuestionnaireForm>,
        currentQuestionnaire as unknown as Questionnaire,
        warnings
      );
    });

    it('should not add warnings for question variable name', () => {
      setQuestionForms({ questionText: 'Some Text' });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });

    it('should not add warnings for answer option variable name', () => {
      setQuestionForms({ answerOptionText: 'Some Text' });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });

    it('should not add warnings for answer type id name', () => {
      setQuestionForms({ answerTypeId: AnswerType.Text });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });

    it('should not add warnings for question and answer option variable name', () => {
      setQuestionForms({
        questionText: 'Some Text',
        answerOptionText: 'Some Text',
      });

      expect(warnings.has(questionForm.controls.variable_name)).toBeFalsy();
      expect(warnings.has(answerOptionForm.controls.variable_name)).toBeFalsy();
    });
  });

  function setQuestionForms({
    questionText,
    answerOptionText,
    answerOptionValueTexts,
    answerTypeId,
  }: {
    questionText?: string | null;
    answerOptionText?: string | null;
    answerOptionValueTexts?: [
      string | null | undefined,
      string | null | undefined
    ];
    answerTypeId?: AnswerType | null;
  }): void {
    const question = questionnaireForm.controls.questions.controls[0].controls;

    if (questionText !== undefined) {
      question.text.setValue(questionText);
    }

    const answerOption = question.answer_options.controls[0];

    if (answerTypeId !== undefined) {
      answerOption.controls.answer_type_id.setValue(answerTypeId);
    }

    if (answerOptionText !== undefined) {
      answerOption.controls.text.setValue(answerOptionText);
    }

    if (answerOptionValueTexts === undefined) {
      return;
    }

    answerOptionValueTexts
      .filter((text) => text !== undefined)
      .forEach((text, i) =>
        answerOption.controls.values.controls[i].controls.value.setValue(text)
      );
  }

  function setFormVariableNames(
    questionVariableName?: string | null,
    answerOptionVariableName?: string | null
  ): void {
    const question = questionnaireForm.controls.questions.controls[0].controls;

    if (questionVariableName !== undefined) {
      question.variable_name.setValue(questionVariableName);
    }

    const answerOption = question.answer_options.controls[0];

    if (answerOptionVariableName !== undefined) {
      answerOption.controls.variable_name.setValue(answerOptionVariableName);
    }
  }

  function setQuestionnaireValuesOnForm(
    questionnaire: Partial<Questionnaire>
  ): void {
    setFormVariableNames(
      questionnaire.questions[0].variable_name,
      questionnaire.questions[0].answer_options[0].variable_name
    );
    setQuestionForms({
      questionText: questionnaire.questions[0].text,
      answerOptionText: questionnaire.questions[0].answer_options[0].text,
      answerOptionValueTexts: [
        questionnaire.questions[0].answer_options[0].values[0],
        questionnaire.questions[0].answer_options[0].values[1],
      ],
      answerTypeId: questionnaire.questions[0].answer_options[0].answer_type_id,
    });
  }
});

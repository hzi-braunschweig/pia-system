/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormArray, FormControl, FormGroup } from '@angular/forms';
import {
  AnswerOptionForm,
  QuestionForm,
  QuestionnaireForm,
} from './questionnaire-form';
import { uniqueVariableNameValidator } from './unique-variable-name-validator';
import 'zone.js';
import 'zone.js/testing';

type QuestionnaireTestForm = Pick<QuestionnaireForm, 'questions'>;

describe('uniqueVariableNameValidator', () => {
  let formGroup: FormGroup<QuestionnaireTestForm>;

  beforeEach(async () => {
    formGroup = new FormGroup<QuestionnaireTestForm>(
      {
        questions: new FormArray<FormGroup<QuestionForm>>([
          createQuestionForm('q1', [
            createAnswerOptionForm('q1a1'),
            createAnswerOptionForm('q1a2'),
            createAnswerOptionForm('q1a3'),
            createAnswerOptionForm('q1a4'),
            createAnswerOptionForm('q1a5'),
          ]),
          createQuestionForm('q2', [
            createAnswerOptionForm('q2a1'),
            createAnswerOptionForm('q2a2'),
          ]),
          createQuestionForm('q3', [
            createAnswerOptionForm('q3a1'),
            createAnswerOptionForm('q3a2'),
          ]),
          createQuestionForm('q4', [
            createAnswerOptionForm('q4a1'),
            createAnswerOptionForm('q4a2'),
          ]),
        ]),
      },
      uniqueVariableNameValidator
    );
  });

  it('should set and return errors when a variable name is redeclared between questions', () => {
    setVariableName(0, null, 'var');
    setVariableName(2, null, 'var');

    expect(collectQuestionErrors()).toEqual([
      {
        redeclaredVariableName: { question: 3 },
      },
      null,
      {
        redeclaredVariableName: { question: 1 },
      },
      null,
    ]);
  });

  it('should set and return errors when a variable name is redeclared between answer options in a question', () => {
    setVariableName(0, 0, 'var');
    setVariableName(0, 1, 'also_var');
    setVariableName(0, 2, 'var');
    setVariableName(0, 4, 'also_var');
    setVariableName(2, 0, 'var');
    setVariableName(2, 1, 'var');

    expect(collectAnswerOptionErrors()).toEqual([
      [
        {
          redeclaredVariableName: { question: 1, answerOption: 3 },
        },
        {
          redeclaredVariableName: { question: 1, answerOption: 5 },
        },
        {
          redeclaredVariableName: { question: 1, answerOption: 1 },
        },
        null,
        {
          redeclaredVariableName: { question: 1, answerOption: 2 },
        },
      ],
      [null, null],
      [
        {
          redeclaredVariableName: { question: 3, answerOption: 2 },
        },
        {
          redeclaredVariableName: { question: 3, answerOption: 1 },
        },
      ],
      [null, null],
    ]);
  });

  it('should clear error on first form control field too, when second form control changed its variable name', () => {
    setVariableName(0, null, 'var');
    setVariableName(3, null, 'var');

    expect(collectQuestionErrors())
      .withContext('Errors are present')
      .toEqual([
        {
          redeclaredVariableName: { question: 4 },
        },
        null,
        null,
        {
          redeclaredVariableName: { question: 1 },
        },
      ]);

    setVariableName(0, null, 'unique_var');

    expect(collectQuestionErrors())
      .withContext(
        'Errors have been cleared when second form field has been fixed'
      )
      .toEqual([null, null, null, null]);
  });

  it('should clear error on second form control field too, when first form control changed its variable name', () => {
    setVariableName(0, null, 'var');
    setVariableName(3, null, 'var');

    expect(collectQuestionErrors())
      .withContext('Errors are present')
      .toEqual([
        {
          redeclaredVariableName: { question: 4 },
        },
        null,
        null,
        {
          redeclaredVariableName: { question: 1 },
        },
      ]);

    setVariableName(3, null, 'unique_var');

    expect(collectQuestionErrors())
      .withContext(
        'Errors have been cleared when first form field has been fixed'
      )
      .toEqual([null, null, null, null]);
  });

  it('should not set and return errors when variable names are reused in answer options in different questions', () => {
    setVariableName(0, 3, 'var');
    setVariableName(3, 1, 'var');

    expect(collectQuestionErrors()).toEqual([null, null, null, null]);
  });

  it('should return null when all variable names are unique', () => {
    expect(collectQuestionErrors()).toEqual([null, null, null, null]);
  });

  it('should return null when variable form controls habe no value', () => {
    formGroup = new FormGroup<QuestionnaireTestForm>(
      {
        questions: new FormArray<FormGroup<QuestionForm>>([
          createQuestionForm('', [
            createAnswerOptionForm(''),
            createAnswerOptionForm(''),
            createAnswerOptionForm(''),
          ]),
          createQuestionForm('', [
            createAnswerOptionForm(''),
            createAnswerOptionForm(''),
          ]),
        ]),
      },
      uniqueVariableNameValidator
    );

    expect(collectQuestionErrors()).toEqual([null, null]);
    expect(collectAnswerOptionErrors()).toEqual([
      [null, null, null],
      [null, null],
    ]);
  });

  function createQuestionForm(
    variableName: string = '',
    answerOptionForms: FormGroup<AnswerOptionForm>[] = []
  ): FormGroup<QuestionForm> {
    return new FormGroup<QuestionForm>({
      answer_options: new FormArray(answerOptionForms),
      variable_name: new FormControl<string>(variableName),
    } as QuestionForm);
  }

  function createAnswerOptionForm(
    variableName: string = ''
  ): FormGroup<AnswerOptionForm> {
    return new FormGroup<AnswerOptionForm>({
      variable_name: new FormControl<string>(variableName),
    } as AnswerOptionForm);
  }

  function setVariableName(
    questionIndex: number,
    answerOptionIndex: number | null,
    variableName: string
  ): void {
    const questionFormGroupControls =
      formGroup.controls.questions.controls[questionIndex].controls;

    if (answerOptionIndex !== null) {
      questionFormGroupControls.answer_options.controls[
        answerOptionIndex
      ].controls.variable_name.setValue(variableName);
    } else {
      questionFormGroupControls.variable_name.setValue(variableName);
    }
  }

  function collectQuestionErrors() {
    return formGroup.controls.questions.controls.map((grp) => {
      return grp.controls.variable_name.errors;
    });
  }

  function collectAnswerOptionErrors() {
    return formGroup.controls.questions.controls.map((grp) =>
      grp.controls.answer_options.controls.flatMap(
        (grp) => grp.controls.variable_name.errors
      )
    );
  }
});

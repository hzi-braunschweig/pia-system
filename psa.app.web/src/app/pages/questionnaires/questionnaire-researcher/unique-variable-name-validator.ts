/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormGroup, ValidationErrors } from '@angular/forms';

import {
  AnswerOptionForm,
  QuestionForm,
  QuestionnaireForm,
} from './questionnaire-form';

export interface DeclaringQuestion {
  formGroup: FormGroup<QuestionForm>;
  position: {
    question: number;
  };
}

export interface DeclaringAnswerOption {
  formGroup: FormGroup<AnswerOptionForm>;
  position: {
    question: number;
    answerOption: number;
  };
}

type DeclaringFormGroup = DeclaringQuestion | DeclaringAnswerOption;

export function uniqueVariableNameValidator(
  formGroup: FormGroup<Pick<QuestionnaireForm, 'questions'>>
): ValidationErrors | null {
  /**
   * Tracks the usage of a variable name by its questions position.
   */
  const questionVariableNames = new Map<string, DeclaringQuestion>();

  /**
   * Tracks the usage of a variable name by its answer options position, grouped by question position.
   * They are grouped by concatenating the variable name with the questions index.
   */
  const answerOptionVariableNames = new Map<string, DeclaringAnswerOption>();

  const questionFromGroups = formGroup.controls.questions.controls;

  let hasError = false;

  questionFromGroups.forEach((questionFormGroup, questionIndex) => {
    const declaringQuestionPosition = {
      formGroup: questionFormGroup,
      position: {
        question: questionIndex + 1,
      },
    };

    if (
      validateFormGroup(declaringQuestionPosition, null, questionVariableNames)
    ) {
      hasError = true;
    }

    questionFormGroup.controls.answer_options.controls.forEach(
      (answerOptionFormGroup, index) => {
        const declaringAnswerOptionPosition = {
          formGroup: answerOptionFormGroup,
          position: {
            ...declaringQuestionPosition.position,
            answerOption: index + 1,
          },
        };

        const result = validateFormGroup(
          declaringAnswerOptionPosition,
          questionIndex,
          answerOptionVariableNames
        );
        if (result) {
          hasError = true;
        }
      }
    );
  });

  return hasError ? { redeclaredVariableName: true } : null;
}

function validateFormGroup(
  currentFormGroup: DeclaringFormGroup,
  groupedBy: number | null,
  mapVariableNamePositions: Map<string, DeclaringFormGroup>
): boolean {
  const formControl = currentFormGroup.formGroup.controls.variable_name;
  const variableName = formControl.value;

  if (!variableName) {
    return false;
  }

  const mapKey = (groupedBy ? groupedBy + '_' : '') + variableName;
  const conflictingFormGroup = mapVariableNamePositions.get(mapKey);

  let hasError = false;

  if (conflictingFormGroup) {
    hasError = true;
    setErrorOn(currentFormGroup, conflictingFormGroup);
  } else {
    mapVariableNamePositions.set(mapKey, currentFormGroup);
    formControl.setErrors(null);
  }

  return hasError;
}

function setErrorOn(
  currentFormGroup: DeclaringFormGroup,
  conflictingFormGroup: DeclaringFormGroup
): void {
  currentFormGroup.formGroup.controls.variable_name.setErrors({
    redeclaredVariableName: conflictingFormGroup.position,
  });
  conflictingFormGroup.formGroup.controls.variable_name.setErrors({
    redeclaredVariableName: currentFormGroup.position,
  });

  currentFormGroup.formGroup.controls.variable_name.markAsTouched();
  conflictingFormGroup.formGroup.controls.variable_name.markAsTouched();
}

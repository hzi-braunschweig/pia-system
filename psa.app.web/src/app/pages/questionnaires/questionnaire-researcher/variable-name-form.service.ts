/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  AnswerOptionForm,
  QuestionForm,
  QuestionnaireForm,
} from './questionnaire-form';
import { Question } from '../../../psa.app.core/models/question';
import { AnswerOption } from '../../../psa.app.core/models/answerOption';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnswerType } from '../../../psa.app.core/models/answerType';

@Injectable()
export class VariableNameFormService implements OnDestroy {
  private stopSubscriptions = new Subject<void>();

  initVariableNameWarning(
    form: FormGroup<QuestionnaireForm>,
    currentQuestionnaire: Questionnaire,
    warnings: Set<FormControl<unknown>>
  ): void {
    form.controls.questions.controls.forEach(
      (questionFormGroup, questionIndex) => {
        const question = currentQuestionnaire.questions[questionIndex];
        this.watchQuestionText(questionFormGroup, question, warnings);

        questionFormGroup.controls.answer_options.controls.forEach(
          (answerOptionFormGroup, answerOptionIndex) => {
            const answerOption = question.answer_options[answerOptionIndex];
            this.watchAnswerOption(
              answerOptionFormGroup,
              answerOption,
              warnings
            );
          }
        );
      }
    );
  }

  ngOnDestroy(): void {
    this.stopSubscriptions.next();
    this.stopSubscriptions.complete();
  }

  private watchAnswerOption(
    answerOptionFormGroup: FormGroup<AnswerOptionForm>,
    answerOption: AnswerOption,
    warnings: Set<FormControl<unknown>>
  ) {
    answerOptionFormGroup.valueChanges
      .pipe(takeUntil(this.stopSubscriptions))
      .subscribe((formValues) => {
        if (
          this.isVariableNameSet(answerOptionFormGroup, answerOption) &&
          (this.hasAnswerOptionTextChanges(formValues.text, answerOption) ||
            this.hasAnswerTypeIdChanged(
              formValues.answer_type_id,
              answerOption
            ) ||
            this.arraysDoNotMatch(
              formValues.values.map((v) => v.value),
              answerOption.values
            ))
        ) {
          warnings.add(answerOptionFormGroup.controls.variable_name);
        } else {
          warnings.delete(answerOptionFormGroup.controls.variable_name);
        }
      });
  }

  private hasAnswerOptionTextChanges(
    formValues: string,
    answerOption: AnswerOption
  ): boolean {
    return formValues !== undefined && formValues !== answerOption.text;
  }

  private hasAnswerTypeIdChanged(
    formValues: AnswerType,
    answerOption: AnswerOption
  ): boolean {
    return (
      formValues !== undefined && formValues !== answerOption.answer_type_id
    );
  }

  private watchQuestionText(
    questionFormGroup: FormGroup<QuestionForm>,
    question: Question,
    warnings: Set<FormControl<unknown>>
  ) {
    questionFormGroup.controls.text.valueChanges
      .pipe(takeUntil(this.stopSubscriptions))
      .subscribe((value) => {
        if (
          this.isVariableNameSet(questionFormGroup, question) &&
          value !== question.text
        ) {
          warnings.add(questionFormGroup.controls.variable_name);
        } else {
          warnings.delete(questionFormGroup.controls.variable_name);
        }
      });
  }

  private arraysDoNotMatch(a: string[], b: string[]): boolean {
    return a.length !== b.length || !a.every((v, i) => v === b[i]);
  }

  private isVariableNameSet(
    control: FormGroup<QuestionForm> | FormGroup<AnswerOptionForm>,
    data: Question | AnswerOption
  ): boolean {
    return (
      ![null, ''].includes(control.value.variable_name) &&
      data.variable_name !== ''
    );
  }
}

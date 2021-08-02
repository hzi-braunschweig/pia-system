/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  Answer,
  AnswerOption,
  AnswerType,
  FileDto,
  Question,
} from '../questionnaire.model';

import { QuestionnaireAnswerValues } from './questionnaire-answer-values';
import { QuestionnaireAnswerValidators } from './questionnaire-answer-validators';
import { QuestionnaireClientService } from '../questionnaire-client.service';
import { QuestionnaireConditionChecker } from '../questionnaire-condition-checker';

export interface SampleFormControlValue {
  sampleId1: string;
  sampleId2: string;
}

export interface ImageFormControlValue {
  fileName: string;
  file: string;
}

export type FormControlValue =
  | string
  | string[]
  | number
  | Date
  | SampleFormControlValue
  | ImageFormControlValue;

@Injectable({
  providedIn: 'root',
})
export class QuestionnaireFormService {
  constructor(
    private fb: FormBuilder,
    private questionnaireClient: QuestionnaireClientService
  ) {}

  static getDefaultFormControlValue(answerType: AnswerType): null | [] {
    if (answerType === AnswerType.MultiSelect) {
      return [];
    } else {
      return null;
    }
  }

  static isEmptyFormControlValue(value: FormControlValue): boolean {
    return QuestionnaireAnswerValidators.isEmptyFormControlValue(value);
  }

  private static getValidatorForAnswerOption(
    answerOption: AnswerOption
  ): ValidatorFn[] | null {
    switch (answerOption.answer_type_id) {
      case AnswerType.Number:
        return [
          Validators.min(answerOption.restriction_min),
          Validators.max(answerOption.restriction_max),
          QuestionnaireAnswerValidators.numberFormat(answerOption.is_decimal),
        ];
      case AnswerType.Date:
        return [
          QuestionnaireAnswerValidators.dateStringMinMax(
            answerOption.restriction_min,
            answerOption.restriction_max
          ),
        ];
      case AnswerType.Image:
        return [QuestionnaireAnswerValidators.isAllowedFileSize()];
      default:
        return [];
    }
  }

  private static parseSampleValue(value): SampleFormControlValue {
    const sampleIds = value.split(';');
    return {
      sampleId1: sampleIds[0] || null,
      sampleId2: sampleIds[1] || null,
    };
  }

  private static stringifyAnswerValue(
    answerType: AnswerType,
    value: FormControlValue
  ): string {
    switch (answerType) {
      case AnswerType.SingleSelect:
      case AnswerType.Text:
      case AnswerType.PZN:
        return value ? (value as string) : '';
      case AnswerType.Timestamp:
        return value ? (value as Date).getTime().toString() : '';
      case AnswerType.MultiSelect:
        return Array.isArray(value) ? value.join(';') : '';
      case AnswerType.Number:
        return value ? value.toString() : '';
      case AnswerType.Date:
        return value instanceof Date ? value.toISOString() : '';
      case AnswerType.Sample:
        return QuestionnaireFormService.stringifySampleFormControlValue(
          value as SampleFormControlValue
        );
      case AnswerType.Image:
        return QuestionnaireFormService.stringifyImageFormControlValue(
          value as ImageFormControlValue
        );
    }
  }

  private static stringifyImageFormControlValue(
    value: ImageFormControlValue
  ): string {
    if (!value) {
      return '';
    }
    return JSON.stringify({
      file_name: value.fileName,
      data: value.file,
    });
  }

  private static stringifySampleFormControlValue(
    value: SampleFormControlValue
  ): string {
    let result = '';
    if (value && value.sampleId1) {
      result += value.sampleId1;
    }
    if (value && value.sampleId2) {
      if (result !== '') {
        result += ';';
      }
      result += value.sampleId2;
    }
    return result;
  }

  async createQuestionnaireAnswersForm(
    questions: Question[],
    answers: Answer[],
    disabled: boolean
  ): Promise<FormArray> {
    const answerValues = new QuestionnaireAnswerValues(answers);
    const conditionChecker = new QuestionnaireConditionChecker(questions);

    return this.fb.array(
      await Promise.all(
        questions.map(async (question) => {
          return this.fb.array(
            await Promise.all(
              question.answer_options.map(async (answerOption) =>
                this.fb.control(
                  {
                    value: await this.parseAnswerValue(
                      answerOption.answer_type_id,
                      answerValues.get(answerOption.id)
                    ),
                    disabled,
                  },
                  QuestionnaireFormService.getValidatorForAnswerOption(
                    answerOption
                  )
                )
              )
            ),
            QuestionnaireAnswerValidators.required(conditionChecker, question)
          );
        })
      )
    );
  }

  getAnswers(questions: Question[], form: FormArray): Answer[] {
    const answers: Answer[] = [];

    questions.forEach((question, questionIndex) => {
      question.answer_options.forEach((answerOption, answerIndex) => {
        const formControl = (form.at(questionIndex) as FormArray).at(
          answerIndex
        );
        if (formControl.invalid) {
          return;
        }
        answers.push({
          question_id: question.id,
          answer_option_id: answerOption.id,
          value: QuestionnaireFormService.stringifyAnswerValue(
            answerOption.answer_type_id,
            formControl.value
          ),
        });
      });
    });
    return answers;
  }

  private async parseAnswerValue(
    answerType: AnswerType,
    value: string
  ): Promise<FormControlValue> {
    switch (answerType) {
      case AnswerType.SingleSelect:
      case AnswerType.Text:
      case AnswerType.PZN:
        return value || null;
      case AnswerType.Timestamp:
        return value ? new Date(Number(value)) : null;
      case AnswerType.MultiSelect:
        return value ? value.split(';') : [];
      case AnswerType.Number:
        return value ? parseFloat(value) : null;
      case AnswerType.Date:
        return value ? new Date(value) : null;
      case AnswerType.Sample:
        return value ? QuestionnaireFormService.parseSampleValue(value) : null;
      case AnswerType.Image:
        return value ? await this.fetchImage(value) : null;
    }
  }

  private async fetchImage(fileId: string): Promise<ImageFormControlValue> {
    const image: FileDto = await this.questionnaireClient.getFileById(fileId);
    return {
      fileName: image.file_name,
      file: image.file,
    };
  }
}

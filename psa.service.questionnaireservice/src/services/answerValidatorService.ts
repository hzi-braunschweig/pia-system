/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyInternalDto } from '@pia-system/lib-http-clients-internal';
import { AnswerOption } from '../entities/answerOption';
import { Question } from '../entities/question';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { AnswerValue, PartialAnswerDto } from '../models/answer';
import { AnswerType } from '../models/answerOption';
import { isUserFileDto } from '../models/userFile';
import isoDateInRangeValidator from './answerTypeValidators/isoDateInRangeValidator';
import fileValidator from './answerTypeValidators/fileValidator';
import imageValidator from './answerTypeValidators/imageValidator';
import multiSelectValidator from './answerTypeValidators/multiselectSelectValidator';
import numberValidator from './answerTypeValidators/numberValidator';
import pznValidator from './answerTypeValidators/pznValidator';
import sampleValidator from './answerTypeValidators/sampleValidator';
import singleSelectValidator from './answerTypeValidators/singleSelectValidator';
import timestampValidator from './answerTypeValidators/timestampValidator';
import { QuestionnaireFilter } from './questionnaireFilter';

enum InvalidAnswerError {
  /**
   * The answer record is missing and needs to be provided, even if the answer value is empty.
   */
  Missing = 'missing',
  /**
   * The question for the answer is mandatory but the answer value is empty.
   */
  Mandatory = 'mandatory',
  /**
   * The answer record has no related question and/or answer option in the questionnaire.
   */
  NotAvailable = 'not available',
  /**
   * The answer value is not valid for the answer type.
   */
  InvalidValue = 'invalid value',
}

export interface ValidationResult {
  question: Question | null;
  answerOption: AnswerOption | null;
  answer: PartialAnswerDto | null;
  error: InvalidAnswerError | null;
  message?: string;
}

export class AnswerValidatorService {
  public static async validate(
    study: StudyInternalDto,
    instance: QuestionnaireInstance,
    answers: PartialAnswerDto[]
  ): Promise<ValidationResult[]> {
    if (!instance.questionnaire?.questions) {
      throw Error(
        'You need to load all questions with your questionnaire instance'
      );
    }

    await QuestionnaireFilter.filterQuestionnaireOfInstance(instance, answers);

    const result: ValidationResult[] = [];

    // Check if all answer options have a corresponding answer
    for (const question of instance.questionnaire.questions) {
      for (const answerOption of question.answerOptions ?? []) {
        result.push(
          this.validateAnswer(answers, answerOption, question, study)
        );
      }
    }

    // Check if any answer has no question / answer option in this questionnaire
    for (const answer of answers) {
      result.push(this.validateAnswerRelations(instance, answer));
    }

    return result;
  }

  /**
   * Will return an error message when an answer value has the wrong value/type in relation to the answer type.
   * In addition, it does validate min/max constraints, MIME types and if a single or multiple choice value is valid.
   * If the value is valid, an empty string else an error message is returned.
   */
  public static isValueValidForAnswerType(
    study: StudyInternalDto,
    answerOption: AnswerOption,
    value: AnswerValue
  ): string | null {
    switch (answerOption.answerTypeId) {
      case AnswerType.None:
      case AnswerType.Text:
        if (typeof value !== 'string') {
          return 'expected: string';
        }
        break;
      case AnswerType.PZN:
        return pznValidator(value);
      case AnswerType.Date:
        return isoDateInRangeValidator(
          value,
          answerOption.restrictionMin,
          answerOption.restrictionMax
        );
      case AnswerType.Timestamp:
        return timestampValidator(value);
      case AnswerType.Number:
        return numberValidator(
          value,
          answerOption.restrictionMin,
          answerOption.restrictionMax
        );
      case AnswerType.SingleSelect:
        return singleSelectValidator(value, answerOption.valuesCode);
      case AnswerType.MultiSelect:
        return multiSelectValidator(value, answerOption.valuesCode);
      case AnswerType.Sample:
        return sampleValidator(
          value,
          study.sample_prefix,
          study.sample_suffix_length,
          study.has_rna_samples ?? false
        );
      case AnswerType.Image:
        return imageValidator(value);
      case AnswerType.File:
        return fileValidator(value);
    }

    return null;
  }

  public static createErrorMessage(results: ValidationResult[]): string {
    const resultsWithErrors = results.filter((r) => r.error !== null);

    resultsWithErrors.sort((a, b) => {
      const sortQuestion =
        a.question && b.question && a.question.position > b.question.position;
      const sortAnswerOption =
        a.answerOption &&
        b.answerOption &&
        a.answerOption.position > b.answerOption.position;
      return sortQuestion || sortAnswerOption ? 1 : -1;
    });

    const errorList = resultsWithErrors
      .map((r) => {
        const qvn = r.question?.variableName ?? '?';
        const avn = r.answerOption?.variableName ?? '?';
        return `${qvn}.${avn} --> ${r.message ?? '?'}\n`;
      })
      .join('');

    return 'The following answers are not valid:\n' + errorList;
  }

  public static isAnswerEmpty(type: AnswerType, value: AnswerValue): boolean {
    if (value === '') {
      return true;
    }

    switch (type) {
      case AnswerType.Image:
      case AnswerType.File:
        return !isUserFileDto(value) || !value.file || !value.fileName;
      case AnswerType.SingleSelect:
      case AnswerType.MultiSelect:
      case AnswerType.Sample:
        return Array.isArray(value) && value.length === 0;
    }

    return false;
  }

  /**
   * @param answers
   * @param answerOption
   * @param question
   * @param study
   * @private
   */
  private static validateAnswer(
    answers: PartialAnswerDto[],
    answerOption: AnswerOption,
    question: Question,
    study: StudyInternalDto
  ): ValidationResult {
    const answer = answers.find((a) => a.answerOption?.id === answerOption.id);

    let error: InvalidAnswerError | null = null;
    let message: string | null = null;

    if (!answer) {
      error = InvalidAnswerError.Missing;
      message = 'missing';
    } else if (
      question.isMandatory &&
      this.isAnswerEmpty(answerOption.answerTypeId, answer.value)
    ) {
      error = InvalidAnswerError.Mandatory;
      message = 'mandatory';
    } else if (answer.value !== null) {
      message = this.isValueValidForAnswerType(
        study,
        answerOption,
        answer.value
      );
      if (message !== null) {
        error = InvalidAnswerError.InvalidValue;
      }
    }

    if (error && message) {
      return {
        error,
        message,
        answer: answer ?? null,
        answerOption,
        question,
      };
    }

    return {
      error: null,
      answer: answer ?? null,
      answerOption,
      question,
    };
  }

  private static validateAnswerRelations(
    instance: QuestionnaireInstance,
    answer: PartialAnswerDto
  ): ValidationResult {
    const question = instance.questionnaire?.questions?.find(
      (q) => q.id === answer.question?.id
    );
    const answerOption = question?.answerOptions?.find(
      (ao) => ao.id === answer.answerOption?.id
    );

    if (!question || !answerOption) {
      return {
        error: InvalidAnswerError.NotAvailable,
        answer,
        message: 'not available',
        answerOption: answer.answerOption ?? null,
        question: answer.question ?? null,
      };
    }

    return {
      error: null,
      answer,
      answerOption: answer.answerOption ?? null,
      question: answer.question ?? null,
    };
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstanceStatus } from '@pia-system/lib-http-clients-internal';
import { SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';
import { AnswerOption } from './entities/answerOption';
import { Question } from './entities/question';

export class CouldNotUpdateGeneratedCustomName extends Error {}

export class QuestionnaireInstanceNotFoundError extends Error {}

export class InvalidQuestionnaireCycleUnitError extends Error {}

export class CouldNotCreateNewRandomVariableNameError extends Error {}

export class VariableNameHasBeenReusedError extends Error {}

export class CouldNotCreateOrUpdateAnswersError extends Error {}

export class ReleaseNeedsAnswersError extends Error {}

export class InvalidStatusTransitionError extends Error {
  public constructor(
    from: QuestionnaireInstanceStatus,
    to: QuestionnaireInstanceStatus
  ) {
    super(`A transition from '${from}' to '${to}' is not allowed`);
  }
}

export class InvalidAnswersError extends Error {}

export class QuestionOrAnswerOptionNotFoundError extends Error {
  public constructor(
    answerOption: Partial<Pick<AnswerOption, 'id' | 'variableName'>>,
    question: Partial<Pick<Question, 'id' | 'variableName'>>
  ) {
    const identifierAnswerOption =
      answerOption.variableName ?? answerOption.id ?? '?';
    const identifierQuestion = question.variableName ?? question.id ?? '?';

    super(
      `The questionnaire has no question/answer option for ${identifierQuestion}.${identifierAnswerOption}`
    );
  }
}

export class SampleTrackingServiceRejectedSampleIdError extends Error {}

export class StudyNotFoundError extends Error {
  public constructor(studyName: string) {
    super(`Study "${studyName}" does not exist`);
  }
}

export class WrongRoleError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'WRONG_ROLE';
}

export class ImportJsonParseError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'IMPORT_JSON_PARSE_ERROR';
  public readonly message = 'Could not parse JSON file';
}

export class ImportJsonSchemaError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'IMPORT_JSON_SCHEMA_INVALID';
}

export class DuplicateQuestionnaireKeyError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'DUPLICATE_QUESTIONNAIRE_KEY';
}

export class ImportConditionQuestionnaireReferenceError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'IMPORT_CONDITION_QUESTIONNAIRE_REFERENCE_ERROR';
}

export class ImportConditionAnswerOptionReferenceError extends SpecificError {
  public readonly statusCode = StatusCodes.BAD_REQUEST;
  public readonly errorCode = 'IMPORT_CONDITION_ANSWER_OPTION_REFERENCE_ERROR';
}

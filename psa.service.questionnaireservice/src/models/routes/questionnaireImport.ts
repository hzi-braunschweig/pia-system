/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

/**
 * A enum to define in witch publish state the questionnaire will be imported.
 */
export enum PublishMode {
  /**
   * On import, the questionnaire will be imported with the given publish state.
   */
  ADAPT = 'adapt',
  /**
   * On import, the publish state will be overwritten and the questionnaire will be imported as hidden.
   */
  HIDDEN = 'hidden',
}

export interface QuestionnaireFile {
  /**
   * The name of the file.
   */
  name: string;
  /**
   * The content of the json file as string.
   * @example
   * '{ "name": "Questionnaire 1" ... }'
   */
  content: string;
}
export const validatorQuestionnaireFile = Joi.object<QuestionnaireFile>({
  name: Joi.string().required().example('Questionnaire-1.json'),
  content: Joi.string().required().example('{...}'),
});

/**
 * The payload of the questionnaire import endpoint.
 */
export interface QuestionnaireImportRequestPayload {
  publishMode: PublishMode;
  questionnaireFiles: QuestionnaireFile[];
}
export const validatorQuestionnaireImportRequestPayload =
  Joi.object<QuestionnaireImportRequestPayload>({
    publishMode: Joi.string()
      .required()
      .valid(PublishMode.ADAPT, PublishMode.HIDDEN)
      .example(PublishMode.ADAPT),
    questionnaireFiles: Joi.array().items(validatorQuestionnaireFile),
  });

/**
 * The params of the questionnaire import endpoint.
 */
export interface QuestionnaireImportRequestParams {
  studyName: string;
}
export const validatorQuestionnaireImportRequestParams =
  Joi.object<QuestionnaireImportRequestParams>({
    studyName: Joi.string().required().example('Teststudy1'),
  });

/**
 * The response body of the questionnaire import endpoint, when the import was successful.
 */
export interface QuestionnaireImportResponseBodySuccess {
  success: true;
}
export const validatorQuestionnaireImportResponseBodySuccess =
  Joi.object<QuestionnaireImportResponseBodySuccess>({
    success: Joi.boolean().valid(true).required(),
  });
export function assertIsQuestionnaireImportResponseBodySuccess(
  obj: unknown
): asserts obj is QuestionnaireImportResponseBodySuccess {
  Joi.assert(obj, validatorQuestionnaireImportResponseBodySuccess);
}

export interface QuestionnaireImportFileError {
  name: string;
  errorCode: string;
  message: string;
}
const validatorQuestionnaireImportFileError =
  Joi.object<QuestionnaireImportFileError>({
    name: Joi.string().required(),
    errorCode: Joi.string().required(),
    message: Joi.string().required(),
  });

export interface QuestionnaireImportResponseBodyError {
  success: false;
  errors: QuestionnaireImportFileError[];
}
export const validatorQuestionnaireImportResponseBodyError =
  Joi.object<QuestionnaireImportResponseBodyError>({
    success: Joi.boolean().valid(false).required(),
    errors: Joi.array().items(validatorQuestionnaireImportFileError).required(),
  });
export function assertIsQuestionnaireImportResponseBodyError(
  obj: unknown
): asserts obj is QuestionnaireImportResponseBodyError {
  Joi.assert(obj, validatorQuestionnaireImportResponseBodyError);
}

export type QuestionnaireImportResponseBody =
  | QuestionnaireImportResponseBodySuccess
  | QuestionnaireImportResponseBodyError;
export const validatorQuestionnaireImportResponseBody =
  Joi.object<QuestionnaireImportResponseBody>({
    success: Joi.boolean().required(),
    errors: Joi.array().items(validatorQuestionnaireImportFileError).optional(),
  });

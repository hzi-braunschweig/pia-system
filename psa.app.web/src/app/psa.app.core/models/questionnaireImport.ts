/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
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

/**
 * The payload of the questionnaire import endpoint.
 */
export interface QuestionnaireImportRequestPayload {
  publishMode: PublishMode;
  questionnaireFiles: QuestionnaireFile[];
}

/**
 * The params of the questionnaire import endpoint.
 */
export interface QuestionnaireImportRequestParams {
  studyName: string;
}

export interface QuestionnaireImportFileError {
  name: string;
  errorCode: string;
  message: string;
}

export interface QuestionnaireImportResponseBody {
  success: boolean;
  errors?: QuestionnaireImportFileError[];
}

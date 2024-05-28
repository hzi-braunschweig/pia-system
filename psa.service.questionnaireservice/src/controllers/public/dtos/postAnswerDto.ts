/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../../models/answer';
import { AnswerTypeKeys } from '../../../models/answerOption';
import { IsoTimestampString } from '../../../models/customTypes';

export interface PostAnswerRequestDto {
  /**
   * @example "question_example"
   */
  questionVariableName: string;
  /**
   * @example "answer_option_example"
   */
  answerOptionVariableName: string;
  value: AnswerValue;
  dateOfRelease?: IsoTimestampString;
}

export type PostAnswerResponseDto = Required<PostAnswerRequestDto> & {
  /**
   * Version number, automatically increased based on questionnaire instance status
   *
   * @isInt
   * @example "1"
   */
  version: number;
  /**
   * The type of the answer option the answer was given for.
   * Use it to narrow the type of answer value.
   * @example "SingleSelect"
   */
  type: AnswerTypeKeys;
};

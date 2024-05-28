/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOptionDto, AnswerType } from './answerOption';
import {
  IsoDateString,
  IsoTimestampString,
  MultipleSelectValue,
  Pzn,
  SingleSelectValue,
  TextValue,
} from './customTypes';
import { QuestionDto } from './question';
import {
  QuestionnaireInstanceDto,
  QuestionnaireInstanceStatus,
} from './questionnaireInstance';
import { SampleDto } from './sample';
import { UserFileDto } from './userFile';

/**
 * @deprecated
 */
export interface Answer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}

/**
 * @deprecated
 */
export interface PostAnswersRequest {
  answers: Pick<Answer, 'question_id' | 'answer_option_id' | 'value'>[];
  date_of_release?: string;
  version: number;
}

export interface AnswerDto {
  questionnaireInstance?: QuestionnaireInstanceDto;
  question?: QuestionDto;
  answerOption?: AnswerOptionDto;
  versioning: number;
  value: AnswerValue;
  dateOfRelease: Date | null;
  releasingPerson: string | null;
}

/**
 * This is an interface for the full answer row of the db select for the export.
 * It includes information about the questionnaire with question and answer, about the questionnaire instance
 * and the answer itself.
 */
export interface FullAnswer {
  questionnaire_name: string;
  questionnaire_version: number;
  user_id: string;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  date_of_issue: Date;
  status: QuestionnaireInstanceStatus;
  question_variable_name: string;
  qposition: number;
  answer_option_variable_name: string;
  aposition: number;
  values: string[] | null;
  values_code: number[] | null;
  a_type: AnswerType;
  versioning: number | null;
  value: string | null;
  date_of_release: Date | null;
  ids: string | null;
}

export interface AnswerData {
  questionnaire_id: number;
  questionnaire_instance_id: number;
  questionnaire_instance_date_of_issue: Date;
  answer_option_id: number;
  answer_option_variable_name: string | null;
  values: number[];
  answer_version: number;
}

export interface AnswerDataDto {
  questionnaireId: number;
  questionnaireInstanceId: number;
  questionnaireInstanceDateOfIssue: string;
  answerOptionId: number;
  answerOptionVariableName: string | null;
  values: number[];
}

export interface AnswerDataFilter {
  status?: QuestionnaireInstanceStatus[];
  minDateOfIssue?: Date;
  maxDateOfIssue?: Date;
  answerOptionIds?: number[];
  answerOptionVariableNames?: string[];
}

export interface AnswerExportAnswer {
  question_id: number;
  answer_option_id: number;
  value: string | null;
  file_id: number | null;
  file_name: string | null;
}

export interface AnswerExportDbRow {
  instance_id: number;
  participant: string;
  is_test_participant: boolean;
  cycle: number;
  date_of_issue: Date;
  answer_date: Date | null;
  answer_status: QuestionnaireInstanceStatus;
  answers: AnswerExportAnswer[];
}

export type PartialAnswerDto = Pick<
  AnswerDto,
  'answerOption' | 'question' | 'value'
>;

/**
 * Value for an answer. It will be validated against the expected answer type.
 *
 * Please keep in mind, the order of types in this union type is the order of
 * validation and casting of values in tsoa.
 */
export type AnswerValue =
  | null
  | TextValue
  | Pzn
  | IsoDateString
  | IsoTimestampString
  | SingleSelectValue
  | MultipleSelectValue
  | SampleDto
  | UserFileDto;

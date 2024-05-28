/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Condition,
  ConditionDto,
  ConditionRequest,
  ConditionResponse,
} from './condition';
import { QuestionDto } from './question';

export interface DbAnswerOption {
  id: number;
  text: string | null;
  variable_name: string | null;
  position: number;
  question_id: number;
  answer_type_id: AnswerType;
  is_condition_target: boolean | null;
  restriction_min: number | null;
  restriction_max: number | null;
  is_decimal: boolean | null;
  is_notable: boolean[] | null;
  values: string[] | null;
  values_code: number[] | null;
}

export enum AnswerType {
  None = 0,
  SingleSelect = 1,
  MultiSelect = 2,
  Number = 3,
  Text = 4,
  Date = 5,
  Sample = 6,
  PZN = 7,
  Image = 8,
  Timestamp = 9,
  File = 10,
}

export type AnswerTypeKeys = keyof typeof AnswerType;

/**
 * @deprecated
 */
export interface AnswerOption extends DbAnswerOption {
  condition: Condition | null;
}

export interface AnswerOptionDto {
  id: number;
  position: number;
  text: string | null;
  answerTypeId: AnswerType;
  isConditionTarget: boolean | null;
  isDecimal: boolean | null;
  isNotable: boolean[] | null;
  variableName: string | null;
  restrictionMax: number | null;
  restrictionMin: number | null;
  values: string[] | null;
  valuesCode: number[] | null;
  question?: QuestionDto;
  condition?: ConditionDto | null;
}

export interface AnswerOptionResponse extends DbAnswerOption {
  condition: ConditionResponse | null;
}

export interface AnswerOptionRequest {
  id?: number;
  text?: string;
  variable_name?: string;
  position: number;
  answer_type_id: number;
  restriction_min?: number;
  restriction_max?: number;
  is_decimal?: boolean;
  condition?: ConditionRequest;
  is_notable?: boolean[];
  values?: { value: string }[];
  values_code?: { value: number }[] | null;
}

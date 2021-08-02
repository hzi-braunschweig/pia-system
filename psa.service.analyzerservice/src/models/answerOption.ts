/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Condition } from './condition';

export interface AnswerOption {
  id: number;
  text: string;
  label: string;
  position: number;
  question_id: number;
  answer_type_id: AnswerType;
  answer_value: string;
  is_condition_target: boolean;
  restriction_min: number;
  restriction_max: number;
  is_decimal: boolean;
  condition?: Condition;
  is_notable: boolean[];
  values: string[];
  values_code: number[];
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

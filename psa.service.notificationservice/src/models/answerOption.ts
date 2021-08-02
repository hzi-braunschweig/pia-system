/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Condition } from './condition';

export interface DbAnswerOption {
  id: number;
  text: string | null;
  label: string | null;
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

export interface AnswerOption extends DbAnswerOption {
  condition: Condition | null;
}

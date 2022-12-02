/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Condition } from './questionnaire';
import { AnswerType } from './answerType';

export interface AnswerOption {
  id: number;
  text: string;
  variable_name: string;
  position: number;
  question_id: number;
  answer_type_id: AnswerType;
  answer_value: string;
  is_condition_target: boolean;
  restriction_min: number;
  restriction_max: number;
  is_decimal: boolean;
  condition: Condition;
  condition_error: string;
  is_notable: boolean[];
  values: string[];
  values_code: number[];
}

export interface Value {
  is_notable: boolean;
  value: string;
  value_coded: number;
  isChecked: boolean;
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerType } from './answerType';
import type {
  ConditionLink,
  ConditionOperand,
  ConditionType,
  Publish,
  QuestionnaireType,
} from './questionnaire';
import { CycleUnit } from './questionnaire';

export interface ConditionInternalLastJson {
  type: ConditionType.INTERNAL_LAST;
  target_question_pos: number;
  target_answer_option_pos: number;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}

export interface ConditionInternalThisJson {
  type: ConditionType.INTERNAL_THIS;
  target_question_pos: number;
  target_answer_option_pos: number;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}

export interface ConditionExternalJson {
  type: ConditionType.EXTERNAL;
  target_questionnaire_custom_name: string;
  target_answer_option_variable_name: string;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}

interface AnswerOptionJson {
  text: string;
  variable_name: string;
  answer_type_id: AnswerType;
  use_autocomplete: boolean;
  is_notable: boolean[];
  values: string[];
  values_code: number[];
  restriction_min?: number;
  restriction_max?: number;
  is_decimal?: boolean;
  condition?:
    | ConditionInternalLastJson
    | ConditionInternalThisJson
    | ConditionExternalJson;
}

interface QuestionJson {
  text: string;
  help_text: string;
  variable_name: string;
  is_mandatory: boolean;
  answer_options: AnswerOptionJson[];
  condition?:
    | ConditionInternalLastJson
    | ConditionInternalThisJson
    | ConditionExternalJson;
}

export interface QuestionnaireJson {
  $schema?: string;
  name: string;
  custom_name: string;
  sort_order: number | null;
  type: QuestionnaireType;
  cycle_amount: number | null;
  activate_at_date: string | null;
  cycle_unit: CycleUnit | null;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  publish: Publish;
  keep_answers: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_weekday: string | null;
  notification_interval: number | null;
  notification_interval_unit: string | null;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_link_to_overview: boolean;
  compliance_needed: boolean;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string | null;
  notify_when_not_filled_day: number | null;
  expires_after_days: number;
  finalises_after_days: number;
  questions: QuestionJson[];
  condition?: ConditionExternalJson;
}

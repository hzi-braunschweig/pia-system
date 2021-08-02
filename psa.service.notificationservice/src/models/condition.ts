/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DbCondition {
  id: number;
  condition_type: ConditionType | null;
  condition_answer_option_id: number | null;
  condition_question_id: number | null;
  condition_questionnaire_id: number | null;
  condition_questionnaire_version: number | null;
  condition_target_questionnaire: number | null;
  condition_target_questionnaire_version: number;
  condition_target_answer_option: number | null;
  condition_operand: ConditionOperand | null;
  condition_value: string | null;
  condition_link: ConditionLink | null;
}

export type Condition = DbCondition;

export enum ConditionType {
  INTERNAL_THIS = 'internal_this',
  INTERNAL_LAST = 'internal_last',
  EXTERNAL = 'external',
}

export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

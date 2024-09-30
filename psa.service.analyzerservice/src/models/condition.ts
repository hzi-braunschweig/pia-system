/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Condition {
  id?: number;
  condition_type: ConditionType;
  condition_answer_option_id: number;
  condition_question_id: number;
  condition_questionnaire_id: number;
  condition_questionnaire_version: number;
  condition_target_questionnaire: number;
  condition_target_questionnaire_version: number;
  condition_target_answer_option: number;
  condition_target_question_pos: number;
  condition_target_answer_option_pos: number;
  condition_value: string;
  condition_operand: ConditionOperand;
  condition_link: ConditionLink | null;
}

export type ConditionType = 'internal_this' | 'internal_last' | 'external';
export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

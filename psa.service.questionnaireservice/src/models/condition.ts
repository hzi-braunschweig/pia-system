/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerOptionDto } from './answerOption';
import { QuestionnaireDto } from './questionnaire';
import { QuestionDto } from './question';

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

/**
 * @deprecated
 */
export type Condition = DbCondition;

export interface ConditionDto {
  id: number;
  type: ConditionType | null;
  value: string | null;
  link: ConditionLink | null;
  operand: ConditionOperand | null;
  targetAnswerOption?: AnswerOptionDto | null;
  targetQuestionnaire?: QuestionnaireDto | null;
  conditionAnswerOption?: AnswerOptionDto | null;
  conditionQuestion?: QuestionDto | null;
  conditionQuestionnaire?: QuestionnaireDto | null;
}

export enum ConditionType {
  INTERNAL_THIS = 'internal_this',
  INTERNAL_LAST = 'internal_last',
  EXTERNAL = 'external',
}
export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

export function isConditionDto(condition: unknown): condition is ConditionDto {
  if (typeof condition !== 'object' || condition === null) {
    return false;
  }
  const check = condition as ConditionDto;
  return (
    typeof check.id === 'number' &&
    [
      null,
      ConditionType.EXTERNAL,
      ConditionType.INTERNAL_THIS,
      ConditionType.INTERNAL_LAST,
    ].includes(check.type) &&
    (check.value === null || typeof check.value === 'string') &&
    // TODO: False positive. Take a look at https://github.com/nodesecurity/eslint-plugin-security/issues/54 to find out if disable can be removed
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    [null, 'AND', 'OR', 'XOR'].includes(check.link) &&
    [null, '<', '>', '<=', '>=', '==', '\\='].includes(check.operand) &&
    (check.targetAnswerOption === undefined ||
      typeof check.targetAnswerOption === 'object') &&
    (check.targetQuestionnaire === undefined ||
      typeof check.targetQuestionnaire === 'object') &&
    (check.conditionAnswerOption === undefined ||
      typeof check.conditionAnswerOption === 'object') &&
    (check.conditionQuestion === undefined ||
      typeof check.conditionQuestion === 'object') &&
    (check.conditionQuestionnaire === undefined ||
      typeof check.conditionQuestionnaire === 'object')
  );
}

export interface ConditionResponse extends Condition {
  error?: number;
}

export interface ConditionRequest {
  condition_type?: string;
  condition_target_questionnaire?: number;
  condition_target_questionnaire_version?: number;
  condition_target_answer_option?: number;
  condition_target_question_pos?: number;
  condition_target_answer_option_pos?: number;
  condition_operand: string;
  condition_value: string;
  condition_link?: string;
}

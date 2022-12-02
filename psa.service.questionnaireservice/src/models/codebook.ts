/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerType } from './answerOption';
import { ConditionLink, ConditionOperand, ConditionType } from './condition';

export enum CodebookBoolean {
  true = 'T',
  false = 'F',
}

export interface CodebookDbRow {
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_study_id: string;
  questionnaire_name: string;
  questionnaire_no_questions: 1;
  answeroption_variable_name: string;
  answeroption_text: string;
  question_id: number;
  question_position: number;
  question_variable_name: string;
  answeroption_position: number;
  answeroption_values: string[];
  values_code: number[];
  no_questions: number;
  question_text: string;
  answer_type_id: AnswerType;
  restriction_min: number;
  restriction_max: number;
  is_mandatory: boolean;
  is_decimal: boolean;
  answeroption_condition_type: ConditionType | null;
  answeroption_condition_target_questionnaire: number | null;
  answeroption_condition_target_questionnaire_version: number | null;
  answeroption_condition_question_id: number | null;
  answeroption_condition_operand: ConditionOperand | null;
  answeroption_condition_value: string | null;
  answeroption_condition_link: ConditionLink | null;
  answeroption_condition_target_questionnaire_name: string | null;
  answeroption_condition_target_question_position: number | null;
  answeroption_condition_target_question_variable_name: string | null;
  answeroption_condition_target_answeroption_position: number | null;
  answeroption_condition_target_answeroption_variable_name: string | null;
  question_condition_type: ConditionType | null;
  question_condition_target_questionnaire: number | null;
  question_condition_target_questionnaire_version: number | null;
  question_condition_question_id: number | null;
  question_condition_operand: ConditionOperand | null;
  question_condition_value: string | null;
  question_condition_link: ConditionLink | null;
  question_condition_target_questionnaire_name: string | null;
  question_condition_target_answeroption_position: number | null;
  question_condition_target_answeroption_variable_name: string | null;
  question_condition_target_question_position: number | null;
  question_condition_target_question_variable_name: string | null;
}

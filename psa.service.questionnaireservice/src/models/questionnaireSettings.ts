/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CycleUnit, QuestionnaireType } from './questionnaire';
import { ConditionLink, ConditionOperand, ConditionType } from './condition';

export interface DbQuestionnaireSettings {
  id: number;
  version: number;
  study_id: string;
  name: string;
  no_questions: number;
  cycle_amount: number | null;
  cycle_unit: CycleUnit | null;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_weekday: string | null;
  notification_interval: number | null;
  notification_interval_unit: string | null;
  activate_at_date: string | null;
  compliance_needed: boolean | null;
  expires_after_days: number;
  finalises_after_days: number;
  version_start: string;
  version_end: string | null;
  readonly updated_at: string | null;
  type: QuestionnaireType | null;
  publish: string | null;
  notify_when_not_filled: boolean | null;
  notify_when_not_filled_time: string | null;
  notify_when_not_filled_day: number | null;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  keep_answers: boolean | null;
  active: boolean;
  condition_type: ConditionType | null;
  condition_target_questionnaire: number | null;
  condition_target_questionnaire_version: number | null;
  condition_target_questionnaire_name: string | null;
  condition_operand: ConditionOperand | null;
  condition_value: string | null;
  condition_question_id: number | null;
  condition_answer_option_id: number | null;
  condition_link: ConditionLink | null;
  condition_target_answeroption_id: number | null;
  condition_target_answeroption_position: number | null;
  condition_target_answeroption_variable_name: string | null;
  condition_target_answeroption_question_id: number | null;
  condition_target_answeroption_question_position: number | null;
  condition_target_answeroption_question_variable_name: string | null;
}

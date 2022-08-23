/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Questionnaire {
  id?: number;
  study_id: string;
  name: string;
  type: string;
  cycle_amount: number;
  cycle_unit: string;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  publish: string;
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
  compliance_needed: boolean;
  expires_after_days: number;
  finalises_after_days: number;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string | null;
  notify_when_not_filled_day: number | null;
  condition?: Condition;
  questions: Question[];
}

export class Condition {
  condition_target_questionnaire: number;
  condition_target_questionnaire_version: number;
  condition_target_answer_option: number;
  condition_target_question_pos?: number;
  condition_target_answer_option_pos?: number;
  condition_operand: string;
  condition_value: string;
  condition_type: string;
  condition_link: string;
}

export interface Question {
  id?: number;
  text: string;
  label: string;
  position: number;
  is_mandatory: boolean;
  condition?: Condition;
  answer_options: AnswerOption[];
}

export interface AnswerOption {
  id?: number;
  text: string;
  label: string;
  position: number;
  answer_type_id: number;
  restriction_min?: number;
  restriction_max?: number;
  is_decimal?: boolean;
  is_notable: boolean[];
  values: { value: string }[];
  values_code: { value: number }[];
  condition?: Condition;
}

export interface Answer {
  question_id: number;
  answer_option_id?: number;
  value: string;
}

export interface Answers {
  answers: Answer[];
  date_of_release?: string;
  version?: number;
}

export class QuestionnaireInstance {
  id: number;
  study_id: string;
  questionnaire_id: number;
  questionnaire_name: string;
  no_questions: number;
  no_answers: number;
  user_id: string;
  progress: number;
  date_of_issue: Date;
  date_of_release_v1: Date;
  date_of_release_v2: Date;
  cycle: number;
  notifications_scheduled: boolean;
  status: string;
  questionnaire: Questionnaire;
}

export enum AnswerOptionId {
  ArraySingle = 1,
  ArrayMulti = 2,
  Number = 3,
  String = 4,
  Date = 5,
  Sample = 6,
  PZN = 7,
  Image = 8,
  DateTime = 9,
  File = 10,
}

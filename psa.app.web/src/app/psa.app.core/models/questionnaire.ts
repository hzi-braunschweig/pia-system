import { Question } from './question';

export class QuestionnaireListResponse {
  questionnaires: Questionnaire[];
  links: { self: { href: string } };
}

export interface Questionnaire {
  id: number;
  study_id: string;
  no_questions: number;
  cycle_amount: number;
  activate_at_date: string;
  cycle_unit: string;
  cycle_per_day?: number;
  cycle_first_hour?: number;
  publish: string;
  // keep_answers: In some cases, questionnaire answers are to be kept, even
  // in case of the answering proband is removed automatically, like it
  // may happen in a SORMAS context. Kept answers might deal with usage
  // satisfaction, for example.
  keep_answers: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  name: string;
  type: string;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  questions: Question[];
  condition: Condition;
  condition_error: string;
  notification_weekday: string;
  notification_interval: number;
  notification_interval_unit: string;
  compliance_needed: boolean;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string;
  notify_when_not_filled_day: number;
  expires_after_days: number;
  finalises_after_days: number;
  condition_postview: any;
  version: number;
}

export class Condition {
  condition_type: string;
  condition_answer_option_id: number;
  condition_question_id: number;
  condition_questionnaire_id: number;
  condition_questionnaire_version: number;
  condition_target_questionnaire: number;
  condition_target_questionnaire_version: number;
  condition_target_answer_option: number;
  condition_target_question_pos: number;
  condition_target_answer_option_pos: number;
  condition_operand: string;
  condition_value: string;
  condition_link: string;
}

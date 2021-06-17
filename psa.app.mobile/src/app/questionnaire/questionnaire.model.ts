// tslint:disable:variable-name

export interface Study {
  name: string;
  description: string;
  access_level: string;
  pm_email: string;
  hub_email: string;
  status: string;
  has_rna_samples?: boolean;
  sample_prefix?: string;
  sample_suffix_length?: number;
  super_study_name?: string;
}

export interface Questionnaire {
  id: number;
  study_id: string;
  name: string;
  no_questions: number;
  cycle_amount: number;
  cycle_unit: string;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  questions: Question[];
  condition: Condition;
}

export interface Question {
  id: number;
  questionnaire_id: number;
  text: string;
  position: number;
  is_mandatory: boolean;
  answer_options: AnswerOption[];
  condition: Condition;
  isInfoQuestion: boolean;
}

export interface AnswerOption {
  answer_type_id: number;
  condition: Condition;
  id: number;
  is_condition_target: boolean;
  is_decimal: boolean;
  is_notable: boolean[];
  label: string;
  position: number;
  question_id: number;
  restriction_min: number;
  restriction_max: number;
  text: string;
  values: string[];
  values_code: number[];
}

export interface Answer {
  question_id: number;
  answer_option_id: number;
  value: string;
}

export enum AnswerType {
  None,
  SingleSelect,
  MultiSelect,
  Number,
  Text,
  Date,
  Sample,
  PZN,
  Image,
  Timestamp,
  File,
}

export interface Condition {
  condition_questionnaire_id: number;
  condition_question_id: number;
  condition_answer_option_id: number;
  condition_target_answer_option: number;
  condition_operand: string;
  condition_value: string;
  condition_link: 'OR' | 'AND' | 'XOR';
  condition_type: 'internal_this' | 'internal_last' | 'external';
}

export interface Value {
  value: string;
  isChecked: boolean;
}

export interface QuestionnaireInstance {
  id: number;
  study_id: string;
  questionnaire_id: number;
  questionnaire_name: string;
  user_id: string;
  date_of_issue: string;
  date_of_release_v1: string;
  date_of_release_v2: string;
  cycle: number;
  status: QuestionnaireStatus;
  notifications_scheduled: boolean;
  progress: number;
  release_version: number;
  questionnaire_version: number;
  transmission_ts: string;
  questionnaire: Questionnaire;
}

export type QuestionnaireStatus =
  | 'inactive'
  | 'expired'
  | 'active'
  | 'in_progress'
  | 'released_once'
  | 'released_twice'
  | 'released';

export interface QuestionnaireInstanceQueue {
  user_id: string;
  questionnaire_instance_id: number;
  date_of_queue: Date;
}

export interface FileDto {
  file_name: string;
  file: string;
}

export class StudyWelcomeText {
  study_id: string;
  welcome_text: string;
  language: string;
}

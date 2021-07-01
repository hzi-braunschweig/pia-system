import { QuestionnaireStatus } from './questionnaireInstance';

export enum AnswerType {
  None = 0,
  SingleSelect = 1,
  MultiSelect = 2,
  Number = 3,
  Text = 4,
  Date = 5,
  Sample = 6,
  PZN = 7,
  Image = 8,
  Timestamp = 9,
  File = 10,
}

/**
 * This is an interface for the full answer row of the db select for the export.
 * It includes information about the questionnaire with question and answer, about the questionnaire instance
 * and the answer itself.
 */
export interface FullAnswer {
  questionnaire_name: string;
  questionnaire_version: number;
  user_id: string;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  date_of_issue: Date;
  status: QuestionnaireStatus;
  question_label: string;
  qposition: number;
  answer_option_label: string;
  aposition: number;
  values: string[] | null;
  values_code: number[] | null;
  a_type: AnswerType;
  versioning: number | null;
  value: string | null;
  date_of_release: Date | null;
}

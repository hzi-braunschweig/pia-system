import { Questionnaire, QuestionnaireForPM } from './questionnaire';

export type QuestionnaireStatus =
  | 'inactive'
  | 'active'
  | 'in_progress'
  | 'released'
  | 'released_once'
  | 'released_twice'
  | 'expired'
  | 'deleted';

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
  questionnaire?: Questionnaire | QuestionnaireForPM;
}

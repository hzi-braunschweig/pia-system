import { AnswerOption } from './answerOption';
import { Condition } from './condition';

export interface Question {
  questionnaire_version: number;
  id: number;
  questionnaire_id: number;
  text: string;
  label: string;
  position: number;
  is_mandatory: boolean;
  jump_step: number;
  answer_options: AnswerOption[];
  condition?: Condition;
  condition_error: string;
}
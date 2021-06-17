import { Condition } from './questionnaire';

export interface AnswerOption {
  id: number;
  text: string;
  label: string;
  position: number;
  question_id: number;
  answer_type_id: number;
  answer_value: string;
  is_condition_target: boolean;
  restriction_min: number;
  restriction_max: number;
  is_decimal: boolean;
  condition: Condition;
  condition_error: string;
  is_notable: boolean[];
  values: string[];
  values_code: number[];
}

export interface Value {
  is_notable: boolean;
  value: string;
  value_coded: number;
  isChecked: boolean;
}

export interface Condition {
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
  condition_value: string;
  condition_operand: ConditionOperand;
  condition_link: ConditionLink | null;
}

export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';

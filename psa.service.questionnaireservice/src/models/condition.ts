import Joi from 'joi';

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
  condition_operand: string;
  condition_value: string;
  condition_link: string;
}

export const conditionValidation = Joi.object().keys({
  condition_target_questionnaire: Joi.number()
    .integer()
    .description('the id of the questionnaire containing the answer option'),
  condition_target_questionnaire_version: Joi.number()
    .integer()
    .description(
      'the version of the questionnaire containing the answer option'
    ),
  condition_target_answer_option: Joi.number()
    .integer()
    .description('the id of the answer option to check for set value'),
  condition_target_question_pos: Joi.number()
    .integer()
    .description('the position of the question to check for set value')
    .allow(null)
    .optional(),
  condition_target_answer_option_pos: Joi.number()
    .integer()
    .description('the position of the answer option to check for set value')
    .allow(null)
    .optional(),
  condition_operand: Joi.string()
    .description('operand of the conditionValidation')
    .default('==')
    .valid('<', '>', '<=', '>=', '==', '\\='),
  condition_value: Joi.string()
    .description('value of the conditionValidation')
    .default('Ja'),
  condition_type: Joi.string()
    .description('type of the conditionValidation')
    .valid('external', 'internal_last', 'internal_this')
    .default('external'),
  condition_link: Joi.string()
    .description('operator to connect multiple conditionValidation values with')
    .valid('AND', 'OR', 'XOR')
    .default('OR'),
});

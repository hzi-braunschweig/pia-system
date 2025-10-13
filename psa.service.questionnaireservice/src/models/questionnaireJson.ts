/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConditionLink, ConditionOperand, ConditionType } from './condition';
import Joi from 'joi';
import {
  CustomName,
  CycleUnit,
  Publish,
  QuestionnaireType,
  validatorCustomName,
} from './questionnaire';
import { AnswerType } from './answerOption';

export interface ConditionInternalLastJson {
  type: ConditionType.INTERNAL_LAST;
  target_question_pos: number;
  target_answer_option_pos: number;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}
const validatorConditionInternalLast = Joi.object<ConditionInternalLastJson>({
  type: Joi.string().valid(ConditionType.INTERNAL_LAST).required(),
  target_question_pos: Joi.number().integer().greater(0).required(),
  target_answer_option_pos: Joi.number().integer().greater(0).required(),
  operand: Joi.string().required(),
  value: Joi.string().required(),
  link: Joi.string().optional(),
});

export interface ConditionInternalThisJson {
  type: ConditionType.INTERNAL_THIS;
  target_question_pos: number;
  target_answer_option_pos: number;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}
const validatorConditionInternalThis = Joi.object<ConditionInternalThisJson>({
  type: Joi.string().valid(ConditionType.INTERNAL_THIS).required(),
  target_question_pos: Joi.number().integer().greater(0).required(),
  target_answer_option_pos: Joi.number().integer().greater(0).required(),
  operand: Joi.string().required(),
  value: Joi.string().required(),
  link: Joi.string().optional(),
});

export interface ConditionExternalJson {
  type: ConditionType.EXTERNAL;
  target_questionnaire_custom_name: CustomName;
  target_answer_option_variable_name: string;
  operand: ConditionOperand;
  value: string;
  link?: ConditionLink;
}
const validatorConditionExternal = Joi.object<ConditionExternalJson>({
  type: Joi.string().valid(ConditionType.EXTERNAL).required(),
  target_questionnaire_custom_name: validatorCustomName.required(),
  target_answer_option_variable_name: Joi.string().required(),
  operand: Joi.string().required(),
  value: Joi.string().required(),
  link: Joi.string().optional(),
});

interface AnswerOptionJson {
  text: string | null;
  variable_name: string | null;
  answer_type_id: AnswerType;
  use_autocomplete: boolean;
  is_notable: boolean[];
  values: string[];
  values_code: number[];
  restriction_min?: number;
  restriction_max?: number;
  is_decimal?: boolean;
  condition?:
    | ConditionInternalLastJson
    | ConditionInternalThisJson
    | ConditionExternalJson;
}
const validatorAnswerOption = Joi.object<
  AnswerOptionJson & {
    id?: number;
    position?: number;
    condition_error?: string;
  }
>({
  text: Joi.string().allow('').allow(null),
  variable_name: Joi.string().allow('').allow(null).default(null),
  answer_type_id: Joi.number<AnswerType>()
    .valid(
      AnswerType.None,
      AnswerType.SingleSelect,
      AnswerType.MultiSelect,
      AnswerType.Number,
      AnswerType.Text,
      AnswerType.Date,
      AnswerType.Sample,
      AnswerType.PZN,
      AnswerType.Image,
      AnswerType.Timestamp,
      AnswerType.File
    )
    .required(),
  use_autocomplete: Joi.boolean().default(false),
  is_notable: Joi.array().items(Joi.boolean()).required(),
  values: Joi.array().items(Joi.string()).required(),
  values_code: Joi.array().items(Joi.number()).required(),
  restriction_min: Joi.number().optional(),
  restriction_max: Joi.number().optional(),
  is_decimal: Joi.boolean().optional(),
  condition: Joi.alternatives()
    .try(
      validatorConditionInternalLast,
      validatorConditionInternalThis,
      validatorConditionExternal
    )
    .optional(),
  /** @deprecated */
  id: Joi.number().optional(),
  /** @deprecated */
  position: Joi.number().optional(),
  /** @deprecated */
  condition_error: Joi.string().allow('').allow(null).optional(),
});

interface QuestionJson {
  text: string;
  help_text: string;
  variable_name: string | null;
  is_mandatory: boolean;
  answer_options: AnswerOptionJson[];
  condition?:
    | ConditionInternalLastJson
    | ConditionInternalThisJson
    | ConditionExternalJson;
}
const validatorQuestionJson = Joi.object<
  QuestionJson & { id?: number; position?: number; condition_error?: string }
>({
  text: Joi.string().required(),
  help_text: Joi.string().allow('').default(''),
  variable_name: Joi.string().allow('').allow(null).default(null),
  is_mandatory: Joi.boolean().default(false),
  answer_options: Joi.array().items(validatorAnswerOption).required(),
  condition: Joi.alternatives()
    .try(
      validatorConditionInternalLast,
      validatorConditionInternalThis,
      validatorConditionExternal
    )
    .optional(),
  /** @deprecated */
  id: Joi.number().optional(),
  /** @deprecated */
  position: Joi.number().optional(),
  /** @deprecated */
  condition_error: Joi.string().allow('').allow(null).optional(),
});

export interface QuestionnaireJson {
  $schema?: string;
  name: string;
  custom_name: CustomName | null;
  sort_order: number | null;
  type: QuestionnaireType;
  cycle_amount: number | null;
  activate_at_date: Date | null;
  cycle_unit: CycleUnit | null;
  cycle_per_day: number | null;
  cycle_first_hour: number | null;
  publish: Publish;
  keep_answers: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  notification_tries: number;
  notification_title: string;
  notification_weekday: string | null;
  notification_interval: number | null;
  notification_interval_unit: string | null;
  notification_body_new: string;
  notification_body_in_progress: string;
  notification_link_to_overview: boolean;
  compliance_needed: boolean;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string | null;
  notify_when_not_filled_day: number | null;
  expires_after_days: number;
  finalises_after_days: number;
  questions: QuestionJson[];
  condition?: ConditionExternalJson;
}
export const validatorQuestionnaireJson = Joi.object<
  QuestionnaireJson & { id?: number; condition_error?: string }
>({
  $schema: Joi.string().uri().optional(),
  name: Joi.string().required(),
  custom_name: validatorCustomName.allow(null).default(null),
  sort_order: Joi.number().integer().allow(null).default(null),
  type: Joi.string<QuestionnaireType>()
    .valid('for_probands', 'for_research_team')
    .default('for_probands'),
  cycle_amount: Joi.number().integer().allow(null).default(null),
  activate_at_date: Joi.date().allow(null).default(null),
  cycle_unit: Joi.string<CycleUnit>()
    .valid('once', 'day', 'week', 'month', 'hour', 'spontan', 'date')
    .allow(null)
    .default(null),
  cycle_per_day: Joi.number().integer().allow(null).default(null),
  cycle_first_hour: Joi.number().integer().allow(null).default(null),
  publish: Joi.string<Publish>()
    .valid('hidden', 'testprobands', 'allaudiences')
    .required(),
  keep_answers: Joi.boolean().default(false),
  activate_after_days: Joi.number().integer().required(),
  deactivate_after_days: Joi.number().integer().required(),
  notification_tries: Joi.number().integer().required(),
  notification_title: Joi.alternatives().conditional('notification_tries', {
    not: 0,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  notification_weekday: Joi.string().allow('').allow(null).default(null),
  notification_interval: Joi.number().integer().allow(null).default(null),
  notification_interval_unit: Joi.string().allow('').allow(null).default(null),
  notification_body_new: Joi.alternatives().conditional('notification_tries', {
    not: 0,
    then: Joi.string().required(),
    otherwise: Joi.string().allow('').default(''),
  }),
  notification_body_in_progress: Joi.alternatives().conditional(
    'notification_tries',
    {
      not: 0,
      then: Joi.string().required(),
      otherwise: Joi.string().allow('').default(''),
    }
  ),
  notification_link_to_overview: Joi.boolean().default(false),
  compliance_needed: Joi.boolean().default(false),
  notify_when_not_filled: Joi.boolean().default(false),
  notify_when_not_filled_time: Joi.string().allow(null).default(null),
  notify_when_not_filled_day: Joi.number().integer().allow(null).default(null),
  expires_after_days: Joi.number().integer().required(),
  finalises_after_days: Joi.number().integer().required(),
  questions: Joi.array().items(validatorQuestionJson).min(1).required(),
  condition: Joi.alternatives().try(validatorConditionExternal).optional(),
  /** @deprecated */
  id: Joi.number().optional(),
  /** @deprecated */
  condition_error: Joi.string().allow('').allow(null).optional(),
});

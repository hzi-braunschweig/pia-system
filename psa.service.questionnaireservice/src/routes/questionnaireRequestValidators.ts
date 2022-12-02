/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

import { Questionnaire } from '../models/questionnaire';
import { ConditionRequest } from '../models/condition';

export const conditionValidation = Joi.object<ConditionRequest>().keys({
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

export const questionnaireRequestPayload = Joi.object<Questionnaire>({
  study_id: Joi.string().required().example('Teststudie1'),
  name: Joi.string().required().example('Testfragebogenname'),
  type: Joi.string()
    .required()
    .default('for_probands')
    .valid('for_probands', 'for_research_team'),
  cycle_amount: Joi.number()
    .integer()
    .description('the number of cycle_units for the questionnaire cycle')
    .example(1)
    .required(),
  cycle_unit: Joi.string()
    .description(
      'the unit for the cycle, must be "once", "day", week" or "month"'
    )
    .example('week')
    .valid('once', 'hour', 'day', 'week', 'month', 'date', 'spontan')
    .required(),
  cycle_per_day: Joi.number()
    .integer()
    .description('only for cycle_amount=hour, defines QIs per day')
    .optional()
    .allow(null),
  cycle_first_hour: Joi.number()
    .integer()
    .description('only for cycle_amount=hour, defines the time of first QI')
    .optional()
    .allow(null),
  publish: Joi.string()
    .description('the publishing state')
    .example('allaudiences')
    .valid('hidden', 'testprobands', 'allaudiences')
    .required(),
  keep_answers: Joi.bool()
    .description('true if answers should be kept on automatic proband removal')
    .optional()
    .default(false),
  activate_after_days: Joi.number()
    .integer()
    .description(
      'the delay in days the questionnaire should be activated after'
    )
    .example(1)
    .required(),
  deactivate_after_days: Joi.number()
    .integer()
    .description('the amount of days the questionnaire should be active')
    .required(),
  notification_tries: Joi.number()
    .integer()
    .description('the number of notifications that will be send for this q')
    .required(),
  notification_title: Joi.string()
    .description('the notification title')
    .example('PIA Fragebogen')
    .required()
    .allow(''),
  notification_body_new: Joi.string()
    .description('the notification message for a new q')
    .example('Sie haben einen neuen Fragebogen')
    .required()
    .allow(''),
  notification_body_in_progress: Joi.string()
    .description('the notification message for a q in progress')
    .example('Sie haben einen unvollständigen Fragebogen')
    .required()
    .allow(''),
  notification_weekday: Joi.string()
    .description('the notifications day of the week')
    .example('monday')
    .optional()
    .allow('')
    .allow(null)
    .valid(
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    ),
  notification_interval: Joi.number()
    .integer()
    .description('the notifications interval')
    .optional()
    .allow('')
    .allow(null),
  notification_interval_unit: Joi.string()
    .description('the notifications interval unit')
    .example('hours')
    .optional()
    .allow('')
    .allow(null)
    .valid('days', 'hours'),
  activate_at_date: Joi.date()
    .description('the date of activation for a set date questionnaire')
    .allow(null)
    .optional(),
  compliance_needed: Joi.bool()
    .description(
      'true if only probands who complied to taking samples get this one'
    )
    .optional()
    .default(false),
  expires_after_days: Joi.number()
    .integer()
    .description('the number in days until the questionnaire will expire')
    .optional(),
  finalises_after_days: Joi.number()
    .integer()
    .description(
      'the number in days until the questionnaire cannot be saved a second time'
    )
    .optional(),
  notify_when_not_filled: Joi.bool()
    .description(
      'send notification if the questionnaire was not filled out in time'
    )
    .optional(),
  notify_when_not_filled_time: Joi.string()
    .regex(/\d\d:\d\d/)
    .description(
      'the time to send the notification if the questionnaire was not filled out'
    )
    .optional()
    .allow(null),
  notify_when_not_filled_day: Joi.number()
    .integer()
    .description(
      'the day to send notification if the questionnaire was not filled out'
    )
    .optional()
    .allow(null),
  condition: conditionValidation.optional(),
  questions: Joi.array()
    .items({
      id: Joi.number()
        .integer()
        .description(
          'the id of the question (will be ignored for POST requests)'
        )
        .optional(),
      text: Joi.string()
        .description('the question text')
        .required()
        .example('Welche Symptome haben Sie?'),
      variable_name: Joi.string()
        .description('an optional variable name for export')
        .allow('')
        .required(),
      position: Joi.number()
        .integer()
        .description('the position of this question in the questionnaire')
        .required()
        .example(1),
      is_mandatory: Joi.bool()
        .description('if the question is obligatory or voluntary')
        .required()
        .example(false),
      condition: conditionValidation.optional(),
      answer_options: Joi.array()
        .items({
          id: Joi.number()
            .integer()
            .description('the id of the answer option')
            .optional(),
          text: Joi.string()
            .description('the answer option text')
            .optional()
            .allow(''),
          variable_name: Joi.string()
            .description('an optional variable name for export')
            .allow('')
            .required(),
          position: Joi.number()
            .integer()
            .description('the position of this answer_option in the question')
            .required()
            .example(1),
          answer_type_id: Joi.number()
            .integer()
            .description('the id of the type of answer option')
            .required()
            .example(1),
          restriction_min: Joi.number()
            .description('minimal value for number or date type')
            .optional(),
          restriction_max: Joi.number()
            .description('maximal value for number or date type')
            .optional(),
          is_decimal: Joi.bool()
            .description('true if answer can be a decimal value ')
            .optional()
            .default(false),
          is_notable: Joi.array()
            .items({
              value: Joi.bool()
                .description(
                  'true if answer value is notable and requires notification'
                )
                .default(false),
            })
            .optional(),
          values: Joi.array().items({
            value: Joi.string()
              .description('a possible answer value')
              .example('value'),
          }),
          values_code: Joi.array()
            .items({
              value: Joi.number()
                .integer()
                .description('the code for a possible answer value')
                .example(1),
            })
            .allow(null)
            .optional(),
          condition: conditionValidation.optional(),
        })
        .min(0)
        .required(),
    })
    .min(1)
    .required(),
});

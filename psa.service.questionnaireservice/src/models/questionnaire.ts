import { Question } from './question';
import { Condition, conditionValidation } from './condition';
import Joi from 'joi';

export type QuestionnaireType = 'for_probands' | 'for_research_team';

export type CycleUnit = 'once' | 'day' | 'week' | 'month' | 'hour' | 'spontan';

export interface QuestionnaireForPM {
  id: number;
  cycle_unit: CycleUnit;
}

export interface Questionnaire extends QuestionnaireForPM {
  id: number;
  study_id: string;
  no_questions: number;
  cycle_amount: number;
  activate_at_date: string;
  cycle_unit: CycleUnit;
  cycle_per_day?: number;
  cycle_first_hour?: number;
  publish: string;
  /*  keep_answers: In some cases, questionnaire answers are to be kept, even
    in case of the answering proband is removed automatically, like it
    may happen in a SORMAS context. Kept answers might deal with usage
    satisfaction, for example. */
  keep_answers: boolean;
  activate_after_days: number;
  deactivate_after_days: number;
  name: string;
  type: QuestionnaireType;
  notification_tries: number;
  notification_title: string;
  notification_body_new: string;
  notification_body_in_progress: string;
  questions?: Question[];
  condition?: Condition;
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
  version: number;
}

const EXAMPLE_DEACTIVATE_AFTER_DAYS = 365;
const EXAMPLE_NOTIFICATION_TRIES = 3;
const EXAMPLE_NOTIFICATION_INTERVAL = 2;
const EXAMPLE_ANSWER_TYPE_ID = 2;

export const questionnaireWithIdValidator = Joi.object({
  study_id: Joi.string().required().default('Teststudie1'),
  name: Joi.string().required().default('Testfragebogenname'),
  type: Joi.string()
    .required()
    .default('for_probands')
    .valid('for_probands', 'for_research_team'),
  cycle_amount: Joi.number()
    .integer()
    .description('the number of cycle_units for the questionnaire cycle')
    .default(1)
    .required(),
  cycle_unit: Joi.string()
    .description(
      'the unit for the cycle, must be "once", "day", week" or "month"'
    )
    .default('week')
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
    .default('allaudiences')
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
    .example(EXAMPLE_DEACTIVATE_AFTER_DAYS)
    .required(),
  notification_tries: Joi.number()
    .integer()
    .description('the number of notifications that will be send for this q')
    .example(EXAMPLE_NOTIFICATION_TRIES)
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
    .required()
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
    .example(EXAMPLE_NOTIFICATION_INTERVAL)
    .required()
    .allow('')
    .allow(null),
  notification_interval_unit: Joi.string()
    .description('the notifications interval unit')
    .example('hours')
    .required()
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
        .description('the id of the question')
        .optional(),
      text: Joi.string()
        .description('the question text')
        .required()
        .example('Welche Symptome haben Sie?'),
      label: Joi.string()
        .description('an optional label for export')
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
          label: Joi.string()
            .description('an optional label for export')
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
            .example(EXAMPLE_ANSWER_TYPE_ID),
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

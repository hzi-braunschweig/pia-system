const Joi = require('joi');

const questionnairesHandler = require('../handlers/questionnairesHandler.js');
const condition = require('../lib/JoiConditon');

module.exports = {
  path: '/questionnaire/revisequestionnaire/{id}',
  method: 'POST',
  handler: questionnairesHandler.revise,
  config: {
    description: 'revises the questionnaire with the specified id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
      }).unknown(),
      payload: Joi.object({
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
          .description(
            'only for cycle_amount=hour, defines the time of first QI'
          )
          .optional()
          .allow(null),
        publish: Joi.string()
          .description('the publishing state')
          .default('allaudiences')
          .valid('hidden', 'testprobands', 'allaudiences')
          .required(),
        keep_answers: Joi.bool()
          .description(
            'true if answers should be kept on automatic proband removal'
          )
          .optional()
          .default(false),
        activate_after_days: Joi.number()
          .integer()
          .description(
            'the delay in days the questionnaire should be activated after'
          )
          .default(1)
          .required(),
        deactivate_after_days: Joi.number()
          .integer()
          .description('the amount of days the questionnaire should be active')
          .default(365)
          .required(),
        notification_tries: Joi.number()
          .integer()
          .description(
            'the number of notifications that will be send for this q'
          )
          .default(3)
          .required(),
        notification_title: Joi.string()
          .description('the notification title')
          .default('PIA Fragebogen')
          .required()
          .allow(''),
        notification_body_new: Joi.string()
          .description('the notification message for a new q')
          .default('Sie haben einen neuen Fragebogen')
          .required()
          .allow(''),
        notification_body_in_progress: Joi.string()
          .description('the notification message for a q in progress')
          .default('Sie haben einen unvollständigen Fragebogen')
          .required()
          .allow(''),
        notification_weekday: Joi.string()
          .description('the notifications day of the week')
          .default('monday')
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
          .default(2)
          .required()
          .allow('')
          .allow(null),
        notification_interval_unit: Joi.string()
          .description('the notifications interval unit')
          .default('hours')
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
        condition: condition.optional(),
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
        questions: Joi.array()
          .items({
            text: Joi.string()
              .description('the question text')
              .required()
              .default('Welche Symptome haben Sie?'),
            label: Joi.string()
              .description('an optional label for export')
              .allow(''),
            position: Joi.number()
              .integer()
              .description('the position of this question in the questionnaire')
              .required()
              .default(1),
            is_mandatory: Joi.bool()
              .description('if the question is obligatory or voluntary')
              .required()
              .default(false),
            condition: condition.optional(),
            answer_options: Joi.array()
              .items({
                // While not used to overwrite anything, this is helpful to copy old conditions onto the new answer option
                id: Joi.number()
                  .integer()
                  .description(
                    "the id of the old questionnaire's answer option"
                  )
                  .optional(),
                text: Joi.string()
                  .description('the answer option text')
                  .optional()
                  .allow(''),
                label: Joi.string()
                  .description('an optional label for export')
                  .allow(''),
                position: Joi.number()
                  .integer()
                  .description(
                    'the position of this answer_option in the question'
                  )
                  .required()
                  .default(1),
                answer_type_id: Joi.number()
                  .integer()
                  .description('the id of the type of answer option')
                  .required()
                  .default(2),
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
                    .default('value'),
                }),
                values_code: Joi.array()
                  .items({
                    value: Joi.number()
                      .integer()
                      .description('the code for a possible answer value')
                      .default(1),
                  })
                  .allow(null)
                  .optional(),
                condition: condition.optional(),
              })
              .min(0)
              .required(),
          })
          .min(1)
          .required(),
      }),
      failAction: (request, h, err) => err, // show detailed validation error
    },
  },
};

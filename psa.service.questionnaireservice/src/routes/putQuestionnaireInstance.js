/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const questionnaireInstancesHandler = require('../handlers/questionnaireInstancesHandler.js');

module.exports = {
  path: '/questionnaire/questionnaireInstances/{id}',
  method: 'PUT',
  handler: questionnaireInstancesHandler.update,
  config: {
    description:
      'updates the questionnaire instance with the specified id to released',
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
        status: Joi.string()
          .optional()
          .default(null)
          .valid(
            'inactive',
            'active',
            'in_progress',
            'released_once',
            'released_twice',
            'released',
            null
          ),
        progress: Joi.number()
          .required()
          .default(0)
          .min(0)
          .max(100)
          .description('progress expressed as a percentage'),
        release_version: Joi.number()
          .optional()
          .default(0)
          .description('number of releasing times'),
      }).unknown(),
    },
    app: {
      /**
       * Whenever this route resolves with status code 200 and the user has enabled logging,
       * this method will be called by the LoggingHandler in order to allow to post a log entry
       *
       * @param request the hapi request object
       * @param user the decoded token of the requesting user
       * @param postLogActivity method which receives the logging activity and logs to the logging service
       */
      log: (request, user, postLogActivity) => {
        const updatedStatus = request.response.source.status;
        let type = null;
        if (request.payload.status && user.role === 'Proband') {
          if (updatedStatus === 'released_once') {
            type = 'q_released_once';
          } else if (updatedStatus === 'released_twice') {
            type = 'q_released_twice';
          }
        }
        if (type) {
          postLogActivity({
            type: type,
            questionnaireID: request.response.source.questionnaire_id + '',
            questionnaireInstanceId: request.response.source.id + '',
            questionnaireName: request.response.source.questionnaire_name,
          });
        }
      },
    },
  },
};

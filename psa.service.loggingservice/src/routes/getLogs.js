/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');
const userLogHandler = require('../handlers/userLogHandler.js');

// This request may have a very long URI therefore
// A POST method type was used in order to receive the parameters as payload
module.exports = {
  path: '/log/logs',
  method: 'POST',
  handler: userLogHandler.getLogs,
  config: {
    description: 'returns log list for proband as configureation it wants',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        fromTime: Joi.date()
          .description(
            'begin of the time interval you want to search as iso date'
          )
          .optional(),
        toTime: Joi.date()
          .description(
            'the end of the time interval you want to search as iso date'
          )
          .optional(),
        probands: Joi.array()
          .items(Joi.string())
          .description(
            'list of probands, for which the logs should be retrieved'
          ),
        questionnaires: Joi.array()
          .items(Joi.string())
          .description(
            'list of questionnaires IDs, for which the logs should be retrieved'
          ),
        activities: Joi.array()
          .items(Joi.string())
          .description(
            'list of activities, for which the logs should be retrieved'
          ),
      }).unknown(),
    },
  },
};

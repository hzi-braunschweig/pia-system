/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const queuesHandler = require('../handlers/queuesHandler');

module.exports = {
  path: '/questionnaire/probands/{user_id}/queues/{instance_id}',
  method: 'DELETE',
  handler: queuesHandler.deleteOne,
  config: {
    description: 'deletes the queued instance if the proband has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string().description('the id of the user').required(),
        instance_id: Joi.string()
          .description('the id of the instance to remove from queue')
          .required(),
      }).unknown(),
    },
  },
};

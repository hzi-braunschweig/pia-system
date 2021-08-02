/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const logoutHandler = require('../handlers/logoutHandler.js');

module.exports = {
  path: '/user/logout',
  method: 'POST',
  handler: logoutHandler.logout,
  config: {
    description: 'Logout',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        username: Joi.string().required().default('Testproband1'),
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
        postLogActivity({ type: 'logout' });
      },
    },
  },
};

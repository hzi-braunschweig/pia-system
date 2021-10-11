/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const { NotificationHandler } = require('../handlers/notificationHandler');

module.exports = {
  path: '/notification/notification/{id}',
  method: 'GET',
  handler: NotificationHandler.getOne,
  config: {
    description: 'get the notification with the specified id',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
      }).unknown(),
    },
  },
};

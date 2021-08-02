/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const fcmTokenHandler = require('../handlers/fcmTokenHandler.js');

module.exports = {
  path: '/notification/fcmToken',
  method: 'POST',
  handler: fcmTokenHandler.postOne,
  config: {
    description: 'posts the users fcm token',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        fcm_token: Joi.string().required().description('the fcm token to post'),
      }),
    },
  },
};

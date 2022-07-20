/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { FcmTokenHandler } from '../../handlers/fcmTokenHandler';

const route: ServerRoute = {
  path: '/fcmToken',
  method: 'POST',
  handler: FcmTokenHandler.postOne,
  options: {
    description: 'posts the users fcm token',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        fcm_token: Joi.string().required().description('the fcm token to post'),
      }),
    },
  },
};

export default route;

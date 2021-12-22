/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import userSettingsHandler from '../handlers/userSettingsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/userSettings/{username}',
  method: 'PUT',
  handler: userSettingsHandler.updateOne,
  options: {
    description: 'updates the users settings',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        logging_active: Joi.boolean()
          .description('activate or deactivate all logging for this user')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

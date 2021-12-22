/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import userSettingsHandler from '../handlers/userSettingsHandler';

const route: ServerRoute = {
  path: '/user/userSettings/{username}',
  method: 'GET',
  handler: userSettingsHandler.getOne,
  options: {
    description: 'gets the users settings',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
    },
  },
};

export default route;

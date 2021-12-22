/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { AccountHandler } from '../../handlers/internal/accountHandler';
import Joi from 'joi';

const route: ServerRoute = {
  path: '/auth/user/{username}',
  method: 'DELETE',
  handler: AccountHandler.deleteAccount,
  options: {
    description: 'deletes an account',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string().required(),
      }).unknown(false),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TokenHandler } from '../handlers/tokenHandler';
import Joi from 'joi';

export default {
  path: '/requestToken',
  method: 'POST',
  handler: TokenHandler.requestToken,
  config: {
    description: 'Request one-time-token for authentication',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        email: Joi.string().description('sormas on pia username').required(),
        password: Joi.string().description('sormas on pia password').required(),
      }).unknown(),
    },
  },
};

/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { ConfigurationHandler } from '../../handlers/configurationHandler';

const route: ServerRoute = {
  path: '/admin/config',
  method: 'POST',
  handler: ConfigurationHandler.postConfig,
  options: {
    description: 'returns the event history configuration',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        active: Joi.any()
          .description('is event history enabled')
          .when('retentionTimeInDays', {
            not: Joi.number().required(),
            then: Joi.valid(false).required(),
          }),
        retentionTimeInDays: Joi.number()
          .description('days to keep events in history')
          .allow(null)
          .required(),
      }).required(),
    },
  },
};

export default route;

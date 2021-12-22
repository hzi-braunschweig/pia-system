/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/users/{username}',
  method: 'DELETE',
  handler: InternalUsersHandler.deleteProbandData,
  options: {
    description: 'deletes a user and all its data',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user to delete')
          .required(),
      }).unknown(),
      query: Joi.object({
        keepUsageData: Joi.boolean()
          .description(
            'will not delete questionnaire answers which are marked to keep its answers and log data if true'
          )
          .default(false)
          .optional(),
        full: Joi.boolean()
          .description(
            'Deletes the user completely. No data will be left. Use this with caution!'
          )
          .default(false)
          .optional(),
      }).unknown(),
    },
  },
};

export default route;

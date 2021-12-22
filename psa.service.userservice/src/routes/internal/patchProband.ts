/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/users/{pseudonym}',
  method: 'PATCH',
  handler: InternalUsersHandler.patchProband,
  options: {
    description: 'get a proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the username of the user to patch')
          .required(),
      }).unknown(),
      payload: Joi.alternatives().try(
        Joi.object({
          status: Joi.string()
            .valid('deactivated')
            .description('the new status of the proband')
            .required(),
        }).description('to deactivate the proband'),
        Joi.object({
          complianceContact: Joi.boolean()
            .valid(false)
            .description('the new status of the proband')
            .required(),
        }).description('to set a contact block')
      ),
    },
  },
};

export default route;

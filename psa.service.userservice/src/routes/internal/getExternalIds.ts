/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/externalId',
  method: 'GET',
  handler: InternalUsersHandler.getExternalIds,
  options: {
    description: 'looks up externalIds based on filters',
    tags: ['api'],
    validate: {
      query: Joi.object({
        study: Joi.string()
          .required()
          .description('the name of the study to query'),
        complianceContact: Joi.boolean(),
      }),
    },
  },
};

export default route;

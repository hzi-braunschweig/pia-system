/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';

const route: ServerRoute = {
  path: '/user/professional/{username}/allProbands',
  method: 'GET',
  handler: InternalUsersHandler.getProbandsWithAccessToFromProfessional,
  options: {
    description:
      'gets all the probands a user with a professional role has access to',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user with the professional role')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { UsersHandler } from '../../handlers/usersHandler';

const route: ServerRoute = {
  path: '/admin/users/{pseudonym}',
  method: 'GET',
  handler: UsersHandler.getProbandAsProfessional,
  options: {
    description: 'get a proband',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:Forscher',
        'realm:Untersuchungsteam',
        'realm:ProbandenManager',
      ],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym of the proband')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;

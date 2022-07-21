/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';

const route: ServerRoute = {
  path: '/admin/probands/{pseudonym}/labResults',
  method: 'GET',
  handler: LaboratoryResultsHandler.getAllResults,
  options: {
    description: 'returns laboratory result list for proband',
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
          .description('the username of the proband')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';

const route: ServerRoute = {
  path: '/admin/probands/{pseudonym}/labResults/{resultId}',
  method: 'GET',
  handler: LaboratoryResultsHandler.getOneResult,
  options: {
    description: 'returns single laboratory result',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Forscher'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the username of the proband')
          .lowercase()
          .required(),
        resultId: Joi.string()
          .uppercase()
          .description('the id of the labresult')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import plannedProbandsHandler from '../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/user/plannedprobands/{user_id}',
  method: 'GET',
  handler: plannedProbandsHandler.getOne,
  options: {
    description: 'get a planned proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description('the pseudonym of the planned proband')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

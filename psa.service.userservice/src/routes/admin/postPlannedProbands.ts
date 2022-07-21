/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PlannedProbandsHandler } from '../../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/admin/plannedprobands',
  method: 'POST',
  handler: PlannedProbandsHandler.createSome,
  options: {
    description: 'creates planned probands',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        pseudonyms: Joi.array()
          .required()
          .items(
            Joi.string()
              .description('the pseudonym of a planned proband')
              .lowercase()
              .default('pseudonym1')
          )
          .min(1),
      }).unknown(),
    },
  },
};

export default route;

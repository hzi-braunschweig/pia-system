/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import plannedProbandsHandler from '../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/user/plannedprobands',
  method: 'POST',
  handler: plannedProbandsHandler.createSome,
  options: {
    description: 'creates planned probands',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        pseudonyms: Joi.array()
          .required()
          .items(
            Joi.string()
              .description('the pseudonym of a planned proband')
              .default('pseudonym1')
          )
          .min(1),
      }).unknown(),
    },
  },
};

export default route;

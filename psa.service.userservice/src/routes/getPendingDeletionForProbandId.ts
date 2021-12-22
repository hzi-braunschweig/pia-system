/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingDeletionsHandler from '../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/user/pendingdeletions/proband/{proband_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForProbandId,
  options: {
    description: 'get a pending deletion',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        proband_id: Joi.string()
          .description(
            'the proband id of the proband for pending deletion to get'
          )
          .required(),
      }).unknown(),
    },
  },
};

export default route;

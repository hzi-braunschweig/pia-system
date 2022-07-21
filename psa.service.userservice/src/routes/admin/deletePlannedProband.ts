/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PlannedProbandsHandler } from '../../handlers/plannedProbandsHandler';

const route: ServerRoute = {
  path: '/admin/plannedprobands/{pseudonym}',
  method: 'DELETE',
  handler: PlannedProbandsHandler.deleteOne,
  options: {
    description: 'deletes a planned proband',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym of the planned proband to delete')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;

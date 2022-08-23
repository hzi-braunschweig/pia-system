/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/sample/{sampleId}',
  method: 'GET',
  handler: PendingDeletionsHandler.getOneForSampleId,
  options: {
    description: 'get a pending deletion',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        sampleId: Joi.string()
          .description(
            'the sample id of the proband for pending deletion to get'
          )
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingStudyChangesHandler } from '../../handlers/pendingStudyChangesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/admin/pendingstudychanges/{id}',
  method: 'PUT',
  handler: PendingStudyChangesHandler.updateOne,
  options: {
    description: 'confirms a pending study change request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.string()
          .description('the id of the pending study change to confirm')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

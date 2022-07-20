/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingStudyChangesHandler } from '../../handlers/pendingStudyChangesHandler';

const route: ServerRoute = {
  path: '/admin/pendingstudychanges/{id}',
  method: 'DELETE',
  handler: PendingStudyChangesHandler.deleteOne,
  options: {
    description: 'cancels a pending study change',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .description('the pending study change id to cancel')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

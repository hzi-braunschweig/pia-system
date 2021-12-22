/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingStudyChangesHandler } from '../handlers/pendingStudyChangesHandler';

const route: ServerRoute = {
  path: '/user/pendingstudychanges/{id}',
  method: 'DELETE',
  handler: PendingStudyChangesHandler.deleteOne,
  options: {
    description: 'cancels a pending study change',
    auth: 'jwt',
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

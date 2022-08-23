/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingPartialDeletionsHandler } from '../../handlers/pendingPartialDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingpartialdeletions',
  method: 'POST',
  handler: PendingPartialDeletionsHandler.createOne,
  options: {
    description: 'creates a partial deletion request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requestedFor: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        probandId: Joi.string()
          .required()
          .description('the probands username to delete data for'),
        fromDate: Joi.date()
          .description('the first date to delete data for')
          .empty('')
          .empty(null)
          .default(new Date(0)),
        toDate: Joi.date()
          .description('the last date to delete data for')
          .empty('')
          .empty(null)
          .default(() => new Date()),
        forInstanceIds: Joi.array()
          .description('ids of questionnaire instances to delete')
          .items(
            Joi.number().integer().description('a questionnaire instance id')
          )
          .allow(null)
          .default(null),
        forLabResultsIds: Joi.array()
          .description('ids of lab results to delete')
          .items(Joi.string().description('a labresult id'))
          .allow(null)
          .default(null),
      }).unknown(),
    },
  },
};

export default route;

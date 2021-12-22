/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import pendingDeletionsHandler from '../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/pendingdeletions',
  method: 'POST',
  handler: pendingDeletionsHandler.createOne,
  options: {
    description: 'creates a deletion request',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .email()
          .required()
          .description('the user who should confirm the deletion'),
        type: Joi.string().required().valid('proband', 'sample', 'study'),
        for_id: Joi.string()
          .required()
          .description(
            'the id the pending deletion request is associated with'
          ),
      }).unknown(),
    },
  },
};

export default route;

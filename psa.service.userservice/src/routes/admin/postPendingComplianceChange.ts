/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { PendingComplianceChangesHandler } from '../../handlers/pendingComplianceChangesHandler';

const route: ServerRoute = {
  path: '/admin/pendingcompliancechanges',
  method: 'POST',
  handler: PendingComplianceChangesHandler.createOne,
  options: {
    description: 'creates a pending compliance change request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requested_for: Joi.string()
          .required()
          .description('the user who should confirm the deletion'),
        proband_id: Joi.string()
          .required()
          .description(
            'the id the proband the pending deletion request is associated with'
          ),
        compliance_labresults_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to see labresults'),
        compliance_samples_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to take samples'),
        compliance_bloodsamples_to: Joi.boolean()
          .optional()
          .description('the new value for the compliance to take bloodsamples'),
      }).unknown(),
    },
  },
};

export default route;

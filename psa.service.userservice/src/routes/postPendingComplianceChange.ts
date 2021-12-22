/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingComplianceChangesHandler from '../handlers/pendingComplianceChangesHandler';

const route: ServerRoute = {
  path: '/user/pendingcompliancechanges',
  method: 'POST',
  handler: pendingComplianceChangesHandler.createOne,
  options: {
    description: 'creates a pending compliance change request',
    auth: 'jwt',
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

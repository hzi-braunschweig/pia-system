/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { InternalComplianceHandler } from '../../handlers/internal/internalComplianceHandler';

const route: ServerRoute = {
  path: '/compliance/{studyName}/agree/{pseudonym}',
  method: 'GET',
  handler: InternalComplianceHandler.hasComplianceAgree,
  options: {
    description: 'checks if the submitted consents are given',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
        pseudonym: Joi.string()
          .description('the pseudonym of the proband')
          .required(),
      }).unknown(),
      query: Joi.object({
        system: Joi.array()
          .items(
            Joi.string().valid('app', 'samples', 'bloodsamples', 'labresults')
          )
          .single()
          .description('the system consents to check')
          .optional(),
        generic: Joi.array()
          .items(Joi.string())
          .single()
          .description(
            'the generic consents (defined by the researcher) to check'
          )
          .optional(),
      }),
    },
  },
};

export default route;

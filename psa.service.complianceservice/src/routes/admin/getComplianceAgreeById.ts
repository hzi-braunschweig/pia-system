/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { ComplianceHandler } from '../../handlers/complianceHandler';

const route: ServerRoute = {
  path: '/admin/{studyName}/agree/instance/{id}',
  method: 'GET',
  handler: ComplianceHandler.getComplianceAgreeById,
  options: {
    description: 'fetches compliance agreement by its id',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:EinwilligungsManager',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
        id: Joi.number()
          .integer()
          .description('the id of the compliance agreement')
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { ComplianceTextHandler } from '../../handlers/complianceTextHandler';

const route: ServerRoute = {
  path: '/admin/{studyName}/text',
  method: 'PUT',
  handler: ComplianceTextHandler.putComplianceText,
  options: {
    description: 'updates the compliance text',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(),
      payload: Joi.object({
        compliance_text: Joi.string().required(),
        to_be_filled_by: Joi.string()
          .valid('Proband', 'Untersuchungsteam')
          .required(),
      }),
    },
  },
};

export default route;

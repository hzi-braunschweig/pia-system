/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { ComplianceTextHandler } from '../../handlers/complianceTextHandler';

const route: ServerRoute = {
  path: '/admin/{studyName}/text/edit',
  method: 'GET',
  handler: ComplianceTextHandler.getComplianceTextEdit,
  options: {
    description:
      'fetches the compliance text with additional information for editing',
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
    },
  },
};

export default route;

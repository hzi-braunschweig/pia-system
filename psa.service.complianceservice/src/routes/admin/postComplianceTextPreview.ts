/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { ComplianceTextHandler } from '../../handlers/complianceTextHandler';

const route: ServerRoute = {
  path: '/admin/text/preview',
  method: 'POST',
  handler: ComplianceTextHandler.postComplianceTextPreview,
  options: {
    description: 'converts the compliance text for preview',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        compliance_text: Joi.string().required(),
      }),
    },
  },
};

export default route;

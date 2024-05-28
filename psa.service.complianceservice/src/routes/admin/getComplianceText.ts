/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ComplianceTextHandler } from '../../handlers/complianceTextHandler';
import { paramsWithStudyNameValidator } from '../complianceRequestValidators';

const route: ServerRoute = {
  path: '/admin/{studyName}/text',
  method: 'GET',
  handler: ComplianceTextHandler.getComplianceText,
  options: {
    description: 'fetches the compliance text',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: paramsWithStudyNameValidator,
  },
};

export default route;

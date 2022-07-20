/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ComplianceTextHandler } from '../../handlers/complianceTextHandler';
import { complianceTextValidator } from '../complianceRequestValidators';

const route: ServerRoute = {
  path: '/{studyName}/text',
  method: 'GET',
  handler: ComplianceTextHandler.getComplianceText,
  options: {
    description: 'fetches the compliance text',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: complianceTextValidator,
  },
};

export default route;

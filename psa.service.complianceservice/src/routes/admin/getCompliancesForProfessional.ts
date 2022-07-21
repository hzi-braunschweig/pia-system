/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ComplianceHandler } from '../../handlers/complianceHandler';

const route: ServerRoute = {
  path: '/admin/agree/all',
  method: 'GET',
  handler: ComplianceHandler.getCompliancesForProfessional,
  options: {
    description: 'fetches compliance agreements for a professional user',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:EinwilligungsManager',
    },
    tags: ['api'],
  },
};

export default route;

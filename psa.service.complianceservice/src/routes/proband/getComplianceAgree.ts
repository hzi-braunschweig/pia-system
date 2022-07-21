/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ComplianceHandler } from '../../handlers/complianceHandler';
import { complianceAgreeParamsValidator } from '../complianceRequestValidators';

const route: ServerRoute = {
  path: '/{studyName}/agree/{pseudonym}',
  method: 'GET',
  handler: ComplianceHandler.getComplianceAgree,
  options: {
    description: 'fetches compliance agreement',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: complianceAgreeParamsValidator,
    },
  },
};

export default route;

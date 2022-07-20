/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ComplianceHandler } from '../../handlers/complianceHandler';
import { complianceAgreeValidator } from '../complianceRequestValidators';

const route: ServerRoute = {
  path: '/{studyName}/agree/{pseudonym}',
  method: 'POST',
  handler: ComplianceHandler.postComplianceAgree,
  options: {
    description: 'creates the compliance agreement for a user',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: complianceAgreeValidator,
  },
};

export default route;

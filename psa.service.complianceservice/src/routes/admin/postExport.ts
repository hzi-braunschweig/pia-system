/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ExportHandler } from '../../handlers/exportHandler';
import { paramsWithStudyNameValidator } from '../complianceRequestValidators';

const route: ServerRoute = {
  path: '/admin/{studyName}/agree/export',
  method: 'POST',
  handler: ExportHandler.createOne,
  options: {
    description: 'fetches compliance agreements for a professional user',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:EinwilligungsManager',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: paramsWithStudyNameValidator,
  },
};

export default route;

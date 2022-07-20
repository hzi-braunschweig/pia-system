/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';

const route: ServerRoute = {
  path: '/admin/labResultsImport',
  method: 'POST',
  handler: LaboratoryResultsHandler.postLabResultsImport,
  options: {
    description: 'triggers the import of labresults from ftp server',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager'],
    },
    tags: ['api'],
  },
};

export default route;

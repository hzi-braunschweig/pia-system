/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudiesHandler } from '../../handlers/studiesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/studies/addresses',
  method: 'GET',
  handler: StudiesHandler.getStudyAddresses,
  options: {
    description: 'get the study addresses',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
  },
};

export default route;

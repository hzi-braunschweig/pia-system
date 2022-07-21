/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { ProbandsToContactHandler } from '../../handlers/probandsToContactHandler';

const route: ServerRoute = {
  path: '/admin/probandstocontact',
  method: 'GET',
  handler: ProbandsToContactHandler.getProbandsToContact,
  options: {
    description: 'get all probands to be contacted',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
  },
};

export default route;

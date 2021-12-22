/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import probandsHandler from '../handlers/probandsToContactHandler';

const route: ServerRoute = {
  path: '/user/probandstocontact',
  method: 'GET',
  handler: probandsHandler.getProbandsToContact,
  options: {
    description: 'get all probands to be contacted',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;

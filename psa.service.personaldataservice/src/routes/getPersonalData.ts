/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PersonalDataHandler } from '../handlers/personalDataHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/personal/personalData',
  method: 'GET',
  handler: PersonalDataHandler.getAll,
  options: {
    description: 'get personal data for all probands',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;

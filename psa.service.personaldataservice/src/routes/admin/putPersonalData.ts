/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { PersonalDataHandler } from '../../handlers/personalDataHandler';
import { personalDataRequestValidator } from '../personalDataRequestValidators';

const route: ServerRoute = {
  path: '/admin/personalData/proband/{pseudonym}',
  method: 'PUT',
  handler: PersonalDataHandler.updateOne,
  options: {
    description: 'updates the personal data for the given proband',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: personalDataRequestValidator,
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { InternalPersonalDataHandler } from '../../handlers/internal/internalPersonalDataHandler';
import { personalDataRequestValidator } from '../personalDataRequestValidators';

const route: ServerRoute = {
  path: '/personal/personalData/proband/{pseudonym}',
  method: 'PUT',
  handler: InternalPersonalDataHandler.createOrUpdate,
  options: {
    description: 'updates or creates personal data for the given proband',
    tags: ['api'],
    validate: personalDataRequestValidator,
  },
};

export default route;

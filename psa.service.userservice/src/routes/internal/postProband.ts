/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';
import { postProbandValidation } from '../probandRequestValidators';

const route: ServerRoute = {
  path: '/user/studies/{studyName}/probands',
  method: 'POST',
  handler: InternalUsersHandler.postProband,
  options: {
    description: 'creates a new proband',
    tags: ['api'],
    validate: postProbandValidation,
  },
};

export default route;

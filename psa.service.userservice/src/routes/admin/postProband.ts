/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { ProbandsHandler } from '../../handlers/probandsHandler';
import { postProbandValidation } from '../probandRequestValidators';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/probands',
  method: 'POST',
  handler: ProbandsHandler.createProband,
  options: {
    description: 'creates a proband',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Untersuchungsteam'],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: postProbandValidation,
  },
};

export default route;

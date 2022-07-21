/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ProbandsHandler } from '../../handlers/probandsHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/probands',
  method: 'GET',
  handler: ProbandsHandler.getAll,
  options: {
    description: 'get all users of the given study',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:ProbandenManager',
        'realm:Untersuchungsteam',
        'realm:Forscher',
      ],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(false),
    },
  },
};

export default route;

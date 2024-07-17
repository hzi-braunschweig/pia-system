/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ProbandsHandler } from '../../handlers/probandsHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/probands/export',
  method: 'GET',
  handler: ProbandsHandler.getExport,
  options: {
    description:
      'get a zip containing the personal data of all probands of a study',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager'],
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

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { ProbandsHandler } from '../../handlers/probandsHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/probandsIDS',
  method: 'POST',
  handler: ProbandsHandler.createIDSProband,
  options: {
    description: 'creates a proband with only ids',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Untersuchungsteam'],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .required()
          .description(
            'the name of the study the proband should be assigned to'
          ),
      }),
      payload: Joi.object({
        ids: Joi.string().required().description('the ids'),
      }).unknown(),
    },
  },
};

export default route;

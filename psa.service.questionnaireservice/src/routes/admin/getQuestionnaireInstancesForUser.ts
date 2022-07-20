/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnaireInstancesHandler } from '../../handlers/questionnaireInstancesHandler';

const route: ServerRoute = {
  path: '/admin/user/{pseudonym}/questionnaireInstances',
  method: 'GET',
  handler: QuestionnaireInstancesHandler.getAllForUser,
  options: {
    description: 'get the questionnaire instances for given proband',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:Forscher',
        'realm:ProbandenManager',
        'realm:Untersuchungsteam',
      ],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description(
            'the user name of the user to get questionnaire instances for'
          )
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { AnswersHandler } from '../../handlers/answersHandler';
import { getAnswersValidation } from '../answersRequestValidators';

const route: ServerRoute = {
  path: '/questionnaireInstances/{id}/answers',
  method: 'GET',
  handler: AnswersHandler.get,
  options: {
    description:
      'get the answers for the questionnaire instance if the user has access',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: getAnswersValidation,
  },
};

export default route;

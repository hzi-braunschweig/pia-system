/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { QuestionnaireInstancesHandler } from '../../handlers/questionnaireInstancesHandler';
import { getQuestionnaireInstanceValidation } from '../questionnaireInstanceRequestValidators';

const route: ServerRoute = {
  path: '/admin/questionnaireInstances/{id}',
  method: 'GET',
  handler: QuestionnaireInstancesHandler.getOne,
  options: {
    description:
      'get the questionnaire instance with the specified id if the user has access',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Untersuchungsteam', 'realm:Forscher'],
    },
    tags: ['api'],
    validate: getQuestionnaireInstanceValidation,
  },
};

export default route;

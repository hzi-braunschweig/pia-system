/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { QuestionnaireInstancesHandler } from '../../handlers/questionnaireInstancesHandler';
import { putQuestionnaireInstanceValidation } from '../questionnaireInstanceRequestValidators';

const route: ServerRoute = {
  path: '/questionnaireInstances/{id}',
  method: 'PUT',
  handler: QuestionnaireInstancesHandler.update,
  options: {
    description:
      'updates the questionnaire instance with the specified id to released',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: putQuestionnaireInstanceValidation,
  },
};

export default route;

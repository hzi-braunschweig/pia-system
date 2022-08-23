/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { AnswersHandler } from '../../handlers/answersHandler';
import { deleteAnswerValidation } from '../answersRequestValidators';

const route: ServerRoute = {
  path: '/admin/questionnaireInstances/{id}/answers/{answerOptionId}',
  method: 'DELETE',
  handler: AnswersHandler.deleteOne,
  options: {
    description: 'deletes an answer for a questionnaire instance',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Forscher', 'realm:Untersuchungsteam'],
    },
    tags: ['api'],
    validate: deleteAnswerValidation,
  },
};

export default route;

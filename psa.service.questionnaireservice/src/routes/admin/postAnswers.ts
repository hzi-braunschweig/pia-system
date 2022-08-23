/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { AnswersHandler } from '../../handlers/answersHandler';
import { postAnswersValidation } from '../answersRequestValidators';

const route: ServerRoute = {
  path: '/admin/questionnaireInstances/{id}/answers',
  method: 'POST',
  handler: AnswersHandler.createOrUpdate,
  options: {
    payload: {
      parse: true,
      maxBytes: 100000000,
    },
    description: 'creates or updates answers for a questionnaire instance',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
    tags: ['api'],
    validate: postAnswersValidation,
  },
};

export default route;

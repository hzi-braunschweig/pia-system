/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { QuestionnairesHandler } from '../handlers/questionnairesHandler';

const route: ServerRoute = {
  path: '/questionnaire/questionnaires',
  method: 'GET',
  handler: QuestionnairesHandler.getAll,
  options: {
    description: 'get all questionnaires the researcher has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};

export default route;

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudiesHandler } from '../handlers/studiesHandler';

module.exports = {
  path: '/questionnaire/studies/addresses',
  method: 'GET',
  handler: StudiesHandler.getStudyAddresses,
  config: {
    description: 'get the study addresses',
    auth: 'jwt',
    tags: ['api'],
  },
};

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies/addresses',
  method: 'GET',
  handler: studiesHandler.getStudyAddresses,
  config: {
    description: 'get the study addresses',
    auth: 'jwt',
    tags: ['api'],
  },
};

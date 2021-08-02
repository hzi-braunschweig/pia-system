/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const studiesHandler = require('../handlers/studiesHandler.js');

module.exports = {
  path: '/questionnaire/studies',
  method: 'GET',
  handler: studiesHandler.getAll,
  config: {
    description: 'get all studies the user has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};

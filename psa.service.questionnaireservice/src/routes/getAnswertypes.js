/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const answertypesHandler = require('../handlers/answertypesHandler.js');

module.exports = {
  path: '/questionnaire/answertypes',
  method: 'GET',
  handler: answertypesHandler.getAll,
  config: {
    description: 'get all answertypes',
    auth: 'jwt',
    tags: ['api'],
  },
};

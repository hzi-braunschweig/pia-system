/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const plannedProbandsHandler = require('../handlers/plannedProbandsHandler.js');

module.exports = {
  path: '/user/plannedprobands',
  method: 'GET',
  handler: plannedProbandsHandler.getAll,
  config: {
    description: 'get all planned probands',
    auth: 'jwt',
    tags: ['api'],
  },
};

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/usersWithSameRole',
  method: 'GET',
  handler: usersHandler.getAllWithSameRole,
  config: {
    description: 'get all users with the same role as a requester',
    auth: 'jwt',
    tags: ['api'],
  },
};

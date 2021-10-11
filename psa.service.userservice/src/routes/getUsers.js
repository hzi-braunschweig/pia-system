/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { UsersHandler } = require('../handlers/usersHandler');

module.exports = {
  path: '/user/users',
  method: 'GET',
  handler: UsersHandler.getAll,
  config: {
    description: 'get all users the requester has access to',
    auth: 'jwt',
    tags: ['api'],
  },
};

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const usersHandler = require('../handlers/usersHandler.js');

module.exports = {
  path: '/user/mobileVersion',
  method: 'GET',
  handler: usersHandler.getMobileVersion,
  config: {
    description: 'get a mobile version',
    tags: ['api'],
  },
};

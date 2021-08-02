/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const tokenHandler = require('../handlers/tokenHandler.js');

// This route is only used by SORMAS

module.exports = {
  path: '/user/requestToken',
  method: 'POST',
  handler: tokenHandler.requestToken,
  config: {
    description: 'Request one-time-token for authentication',
    auth: 'simple',
  },
};

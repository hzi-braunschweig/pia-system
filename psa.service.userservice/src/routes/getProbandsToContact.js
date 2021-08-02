/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const probandsHandler = require('../handlers/probandsHandler.js');

module.exports = {
  path: '/user/probandstocontact',
  method: 'GET',
  handler: probandsHandler.getProbandsToContact,
  config: {
    description: 'get all probands to be contacted',
    auth: 'jwt',
    tags: ['api'],
  },
};

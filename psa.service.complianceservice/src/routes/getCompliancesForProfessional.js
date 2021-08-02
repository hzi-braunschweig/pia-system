/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const complianceHandler = require('../handlers/complianceHandler.js');

module.exports = {
  path: '/compliance/agree/all',
  method: 'GET',
  handler: complianceHandler.getCompliancesForProfessional,
  config: {
    description: 'fetches compliance agreements for a professional user',
    auth: 'jwt',
    tags: ['api'],
  },
};

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/labResultsImport',
  method: 'POST',
  handler: laboratoryResultsHandler.postLabResultsImport,
  options: {
    description: 'triggers the import of labresults from ftp server',
    auth: 'jwt',
    tags: ['api'],
  },
};

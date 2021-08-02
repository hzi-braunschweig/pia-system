/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

exports.cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});

exports.setupFile = new QueryFile(path.join(__dirname, 'setup.sql'), {
  minify: true,
});

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const QueryFile = require('pg-promise').QueryFile;
const path = require('path');

const trigger = require('../trigger.data/trigger.helper');

const { db } = require('../../../src/db');

const setupFile = new QueryFile(path.join(__dirname, 'setup.sql'), {
  minify: true,
});
const cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});

exports.setup = async function () {
  await trigger.disable();
  await db.none(cleanupFile);
  await db.none(setupFile);
  await trigger.enable();
};

exports.cleanup = async function () {
  await trigger.disable();
  await db.none(cleanupFile);
  await trigger.enable();
};

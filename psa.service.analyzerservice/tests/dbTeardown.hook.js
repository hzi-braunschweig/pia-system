/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pgp = require('pg-promise')();

exports.mochaHooks = {
  afterAll(done) {
    console.log('closing db pool...');
    pgp.end();
    done();
  },
};

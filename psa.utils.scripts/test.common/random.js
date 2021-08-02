/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const crypto = require('crypto');

const random = {
  createRandomString: function (length) {
    return crypto
      .randomBytes(length / 2 + 1)
      .toString('hex')
      .substring(0, length);
  },
};

module.exports = random;

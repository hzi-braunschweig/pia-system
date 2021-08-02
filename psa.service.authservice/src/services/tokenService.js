/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { db } = require('../db');

const tokenService = {
  storeToken: function (token) {
    return db.tx((t) => {
      return t
        .one(
          'INSERT INTO one_time_auth_token(token) VALUES (${token}) RETURNING token',
          {
            token: token,
          }
        )
        .then(() => {
          console.log('One-time-token was stored successfully');
        })
        .catch((exc) => {
          throw new Error(exc);
        });
    });
  },

  isValid: async function (token) {
    const result = await db.oneOrNone(
      'DELETE FROM one_time_auth_token where token=${token} RETURNING *;',
      { token: token }
    );
    return !!(result && result.token === token);
  },
};

module.exports = tokenService;

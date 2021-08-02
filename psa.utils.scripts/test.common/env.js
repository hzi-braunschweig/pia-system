/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fs = require('fs');

const env = {
  read: function (path) {
    if (!path) {
      return {};
    }
    const lines = fs.readFileSync(path, { encoding: 'utf8' }).split('\n');
    return Object.fromEntries(
      lines
        .map((line) => {
          if (line.length === 0) {
            return null;
          }
          const parts = line.split('=');
          if (parts.length !== 2) {
            throw new Error(`invalid env line: "${line}"`);
          }
          return [parts[0].trim(), parts[1].trim()];
        })
        .filter((e) => {
          return e !== null;
        })
    );
  },
  update: function (values) {
    for (const [key, value] of Object.entries(values)) {
      if (!process.env.hasOwnProperty(key)) {
        process.env[key] = value;
      }
    }
  },
};

module.exports = env;

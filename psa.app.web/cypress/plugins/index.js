/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const cypressLogToOutput = require('cypress-log-to-output');
const { rm } = require('fs');

module.exports = (on) => {
  cypressLogToOutput.install(on);

  on('task', {
    deleteFolder(folderName) {
      return new Promise((resolve, reject) => {
        rm(
          folderName,
          { maxRetries: 10, recursive: true, force: true },
          (err) => {
            if (err) {
              console.error(err);

              return reject(err);
            }

            resolve(null);
          }
        );
      });
    },
  });
};

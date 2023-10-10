/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const cypressLogToOutput = require('cypress-log-to-output');
const { rm, existsSync, readFileSync } = require('fs');

export default function filesystemPlugin(
  on: Cypress.PluginEvents,
  _config: Cypress.PluginConfigOptions
): void {
  cypressLogToOutput.install(on);

  on('task', {
    deleteFolder(folderName: string): Promise<null> {
      return new Promise((resolve, reject) => {
        rm(
          folderName,
          { maxRetries: 10, recursive: true, force: true },
          (err) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    readFileMaybe(filename: string): string | null {
      if (existsSync(filename)) {
        return readFileSync(filename, 'utf8');
      }
      return null;
    },
  });
}

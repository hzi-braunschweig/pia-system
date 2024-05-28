/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const cypressLogToOutput = require('cypress-log-to-output');
const { rm, existsSync, readFileSync } = require('fs');

export default function nodeEvents(
  on: Cypress.PluginEvents,
  _config: Cypress.PluginConfigOptions
): void {
  cypressLogToOutput.install(on);

  // Remove video files if tests pass to avoid additional execution time by compressing it
  on('after:spec', (spec, results) => {
    return new Promise((resolve, reject) => {
      if (results.stats.failures === 0 && results.video) {
        rm(results.video, { force: true }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  });

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

  on('before:browser:launch', (browser = {} as any, launchOptions) => {
    // needed to be able to read/write local storage when connecting via http (in pipeline e2e-tests)
    if (browser.family === 'chromium') {
      launchOptions.args.push('--unsafely-treat-insecure-origin-as-secure');
    }

    return launchOptions;
  });
}

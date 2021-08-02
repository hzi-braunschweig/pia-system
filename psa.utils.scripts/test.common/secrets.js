/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const childProcess = require('child_process');
const fs = require('fs');

// We have to do everything sync so that everything is prepared when the require that called us returns

const options = {
  AUTH_KEY_SIZE: 2048,
  CA_KEY_SIZE: 2048,
  SERVICE_KEY_SIZE: 2048,
  CA_VALIDITY_DAYS: 36500,
  SERVICE_VALIDITY_DAYS: 36500,
};

const docker = {
  build: function (path, outputPath, buildArgs) {
    const arg = Object.entries(buildArgs)
      .map(([key, value]) => `--build-arg ${key}=${value}`)
      .join(' ');
    childProcess.execSync(`docker build -o ${outputPath} ${arg} ${path}`, {
      env: {
        DOCKER_BUILDKIT: '1',
      },
    });
  },
};

// We do not want to setup the ci environment
if (!process.env.CI) {
  console.log('generating secrets');
  docker.build('../psa.utils.scripts/generate-secrets', '.', options);
  docker.build('../psa.utils.scripts/generate-secrets', '../secrets/', options);
  fs.copyFileSync('authKey/private.key', 'tests/private.key');
}

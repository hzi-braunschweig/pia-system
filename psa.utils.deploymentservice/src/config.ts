/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

function getEnvVariable(key: string, fallback?: string): string {
  const result = process.env[key];
  if (result === undefined) {
    if (fallback) {
      return fallback;
    }
    throw new Error(`missing config variable '${key}'`);
  }
  return result;
}

export default {
  services: {
    databaseservice: {
      host: getEnvVariable('QPIA_HOST'),
      port: getEnvVariable('QPIA_PORT'),
      user: getEnvVariable('QPIA_USER'),
      password: getEnvVariable('QPIA_PASSWORD'),
      database: getEnvVariable('QPIA_DB'),
    },
  },
  features: {
    import: getEnvVariable('ENABLE_DB_IMPORT').toLowerCase() === 'true',
    export: getEnvVariable('ENABLE_DB_EXPORT').toLowerCase() === 'true',
  },
  authorization: {
    user: getEnvVariable('DEPLOYMENT_USER'),
    password: getEnvVariable('DEPLOYMENT_PASSWORD'),
  },
  web: {
    port: parseInt(getEnvVariable('PORT', '4000'), 10),
  },
  system: {
    isDevelopment:
      getEnvVariable('IS_DEVELOPMENT_SYSTEM', 'false').toLowerCase() === 'true',
  },
};

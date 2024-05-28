/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('loggingservice'),
  internal: GlobalConfig.getInternal('loggingservice'),
  database: {
    host: ConfigUtils.getEnvVariable('DB_LOG_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_LOG_PORT')),
    user: ConfigUtils.getEnvVariable('DB_LOG_USER'),
    password: ConfigUtils.getEnvVariable('DB_LOG_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_LOG_DB'),
  },
  services: {
    userservice: GlobalConfig.userservice,
  },
  servers: {
    authserver: {
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

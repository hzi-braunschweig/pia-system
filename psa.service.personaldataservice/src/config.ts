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
  public: GlobalConfig.getPublic('personaldataservice'),
  internal: GlobalConfig.getInternal('personaldataservice'),
  database: {
    host: ConfigUtils.getEnvVariable('DB_PERSONALDATA_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_PERSONALDATA_PORT')),
    user: ConfigUtils.getEnvVariable('DB_PERSONALDATA_USER'),
    password: ConfigUtils.getEnvVariable('DB_PERSONALDATA_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_PERSONALDATA_DB'),
  },
  services: {
    loggingservice: GlobalConfig.loggingservice,
    userservice: GlobalConfig.userservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('personaldataservice'),
    authserver: {
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
      probandManagementClient: GlobalConfig.authserver.probandManagementClient,
    },
  },
  adminAppUrl: GlobalConfig.adminAppUrl,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

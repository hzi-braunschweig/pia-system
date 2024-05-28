/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('eventhistoryserver'),
  database: {
    host: ConfigUtils.getEnvVariable('DB_EVENTHISTORY_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_EVENTHISTORY_PORT')),
    user: ConfigUtils.getEnvVariable('DB_EVENTHISTORY_USER'),
    password: ConfigUtils.getEnvVariable('DB_EVENTHISTORY_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_EVENTHISTORY_DB'),
  },
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('eventhistoryserver'),
    authserver: {
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
  timeZone: GlobalConfig.timeZone,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

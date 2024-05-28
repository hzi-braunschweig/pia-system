/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('feedbackstatisticservice'),
  internal: GlobalConfig.getInternal('feedbackstatisticservice'),
  database: {
    host: ConfigUtils.getEnvVariable('DB_FEEDBACKSTATISTIC_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_FEEDBACKSTATISTIC_PORT')),
    user: ConfigUtils.getEnvVariable('DB_FEEDBACKSTATISTIC_USER'),
    password: ConfigUtils.getEnvVariable('DB_FEEDBACKSTATISTIC_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_FEEDBACKSTATISTIC_DB'),
  },
  services: {
    questionnaireservice: GlobalConfig.questionnaireservice,
    userservice: GlobalConfig.userservice,
  },
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('feedbackstatisticservice'),
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
  notificationTime: {
    hours: 8, // in the time zone configured above
    minutes: 0,
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

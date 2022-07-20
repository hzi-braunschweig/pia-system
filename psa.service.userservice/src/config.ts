/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/us.cert'),
  key: ConfigUtils.getFileContent('./ssl/us.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  internal: GlobalConfig.internal,
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    loggingservice: GlobalConfig.loggingservice,
    personaldataservice: GlobalConfig.personaldataservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('userservice'),
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      probandManagementClient: GlobalConfig.authserver.probandManagementClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
      adminManagementClient: GlobalConfig.authserver.adminManagementClient,
    },
  },
  webappUrl: GlobalConfig.webappUrl,
  apiKey: ConfigUtils.getEnvVariable('API_KEY'),
  studyForExternalSystem: 'ZIFCO-Studie',
  userPasswordLength: parseInt(
    ConfigUtils.getEnvVariable('USER_PASSWORD_LENGTH'),
    10
  ),
  isDevelopmentSystem: GlobalConfig.isDevelopmentSystem(),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

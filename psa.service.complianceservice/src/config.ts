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
  cert: ConfigUtils.getFileContent('./ssl/cs.cert'),
  key: ConfigUtils.getFileContent('./ssl/cs.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  internal: GlobalConfig.internal,
  database: {
    host: ConfigUtils.getEnvVariable('EWPIA_HOST'),
    port: Number(ConfigUtils.getEnvVariable('EWPIA_PORT')),
    user: ConfigUtils.getEnvVariable('EWPIA_USER'),
    password: ConfigUtils.getEnvVariable('EWPIA_PASSWORD'),
    database: ConfigUtils.getEnvVariable('EWPIA_DB'),
    dialect: ConfigUtils.getEnvVariable('EWPIA_DIALECT', 'postgres'),
    ssl: {
      rejectUnauthorized:
        ConfigUtils.getEnvVariable('EWPIA_ACCEPT_UNAUTHORIZED', 'false') !==
        'true',
      cert: SSL_CERTS.cert,
      key: SSL_CERTS.key,
      ca: SSL_CERTS.ca,
    },
  },
  services: {
    userservice: GlobalConfig.userservice,
  },
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('complianceservice'),
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
  defaultLanguage: ConfigUtils.getEnvVariable('DEFAULT_LANGUAGE', 'de-DE'),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

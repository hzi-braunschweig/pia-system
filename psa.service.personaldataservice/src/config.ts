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
  cert: ConfigUtils.getFileContent('./ssl/pe.cert'),
  key: ConfigUtils.getFileContent('./ssl/pe.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  internal: GlobalConfig.internal,
  database: {
    host: ConfigUtils.getEnvVariable('DB_PERSONALDATA_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_PERSONALDATA_PORT')),
    user: ConfigUtils.getEnvVariable('DB_PERSONALDATA_USER'),
    password: ConfigUtils.getEnvVariable('DB_PERSONALDATA_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_PERSONALDATA_DB'),
    ssl: {
      rejectUnauthorized:
        ConfigUtils.getEnvVariable(
          'DB_PERSONALDATA_ACCEPT_UNAUTHORIZED',
          'false'
        ) !== 'true',
      cert: SSL_CERTS.cert,
      key: SSL_CERTS.key,
      ca: SSL_CERTS.ca,
    },
  },
  services: {
    authservice: GlobalConfig.authservice,
    loggingservice: GlobalConfig.loggingservice,
    userservice: GlobalConfig.userservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('personaldataservice'),
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  webappUrl: GlobalConfig.webappUrl,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

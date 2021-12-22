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
  cert: ConfigUtils.getFileContent('./ssl/auth.cert'),
  key: ConfigUtils.getFileContent('./ssl/auth.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  internal: GlobalConfig.internal,
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    personaldataservice: GlobalConfig.personaldataservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('authservice'),
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  isTestMode: ConfigUtils.getEnvVariable('IS_TEST_MODE', 'false') === 'true',
  webappUrl: GlobalConfig.webappUrl,
  privateAuthKey: ConfigUtils.getFileContent('./authKey/private.key'),
  minUserPasswordLength: parseInt(
    ConfigUtils.getEnvVariable('USER_PASSWORD_LENGTH'),
    10
  ),
  maxUserPasswordLength: 80,
  ipCheckEnabled:
    ConfigUtils.getEnvVariable(
      'IP_CHECK_ENABLED',
      'false'
    ).toLocaleLowerCase() === 'true',
  certCheckEnabled:
    ConfigUtils.getEnvVariable(
      'CERT_CHECK_ENABLED',
      'false'
    ).toLocaleLowerCase() === 'true',
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

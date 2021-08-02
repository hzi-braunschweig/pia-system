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
    loggingservice: GlobalConfig.loggingservice,
    personaldataservice: GlobalConfig.personaldataservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  webappUrl: GlobalConfig.webappUrl,
  privateAuthKey: ConfigUtils.getFileContent('./authKey/private.key'),
  userPasswordLength: parseInt(
    ConfigUtils.getEnvVariable('USER_PASSWORD_LENGTH'),
    10
  ),
  sormasOnPiaUser: ConfigUtils.getEnvVariable('SORMAS_ON_PIA_USER', ''),
  sormasOnPiaPassword: ConfigUtils.getEnvVariable('SORMAS_ON_PIA_PASSWORD', ''),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

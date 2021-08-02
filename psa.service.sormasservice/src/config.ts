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
  cert: ConfigUtils.getFileContent('./ssl/so.cert'),
  key: ConfigUtils.getFileContent('./ssl/so.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

let fixedSormasServer = ConfigUtils.getEnvVariable('SORMAS_SERVER');
if (fixedSormasServer && !fixedSormasServer.includes('://')) {
  fixedSormasServer = 'https://' + fixedSormasServer;
}
if (fixedSormasServer.endsWith('/')) {
  fixedSormasServer = fixedSormasServer.substr(0, fixedSormasServer.length - 1);
}

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  internal: GlobalConfig.internal,
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    userservice: GlobalConfig.userservice,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  sormas: {
    url: fixedSormasServer,
    username: ConfigUtils.getEnvVariable('PIA_ON_SORMAS_USER'),
    password: ConfigUtils.getEnvVariable('PIA_ON_SORMAS_PASSWORD'),
  },
  isTesting: false,
  verbose: ConfigUtils.getEnvVariable('VERBOSE', 'false') === 'true',
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

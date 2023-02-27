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
  cert: ConfigUtils.getFileContent('./ssl/qu.cert'),
  key: ConfigUtils.getFileContent('./ssl/qu.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS, 'questionnaireservice'),
  internal: GlobalConfig.getInternal('questionnaireservice'),
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    userservice: GlobalConfig.userservice,
    complianceservice: GlobalConfig.complianceservice,
  },
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('questionnaireservice'),
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
  timeZone: GlobalConfig.timeZone,
  isTestMode: ConfigUtils.getEnvVariable('IS_TEST_MODE', 'false') === 'true',
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

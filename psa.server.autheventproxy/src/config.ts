/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoginWebAppProxy } from './proxys/loginWebAppProxy';
import { LoginMobileAppProxy } from './proxys/loginMobileAppProxy';
import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';
import { EventProxy } from './proxys/eventProxy';

export const proxys: typeof EventProxy[] = [
  LoginWebAppProxy,
  LoginMobileAppProxy,
];

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/aep.cert'),
  key: ConfigUtils.getFileContent('./ssl/aep.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('autheventproxy'),
    authserver: {
      messageQueueExchange: ConfigUtils.getEnvVariable(
        'AUTHSERVER_MESSAGEQUEUE_EXCHANGE'
      ),
    },
  },
  isDevelopmentSystem: GlobalConfig.isDevelopmentSystem(),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

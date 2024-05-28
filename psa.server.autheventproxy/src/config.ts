/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('autheventproxy'),
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('autheventproxy'),
    authserver: {
      probandManagementClient: GlobalConfig.authserver.probandManagementClient,
      messageQueueExchange: ConfigUtils.getEnvVariable(
        'AUTHSERVER_MESSAGEQUEUE_EXCHANGE'
      ),
    },
  },
  isDevelopmentSystem: GlobalConfig.isDevelopmentSystem(),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

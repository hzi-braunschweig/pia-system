/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ConfigUtils,
  GlobalConfig,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('analyzerservice'),
  database: GlobalConfig.getQPia(),
  isTestMode: ConfigUtils.getEnvVariable('IS_TEST_MODE', 'false') === 'true',
  timeZone: GlobalConfig.timeZone,
  notificationTime: {
    hours: 8, // in the time zone configured above
    minutes: 0,
  },
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('analyzerservice'),
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

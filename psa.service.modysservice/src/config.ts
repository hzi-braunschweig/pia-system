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
import { ModysConfig } from './models/modys';

const modysConfig: ModysConfig = {
  baseUrl: ConfigUtils.getEnvVariable('MODYS_BASE_URL'),
  username: ConfigUtils.getEnvVariable('MODYS_USERNAME'),
  password: ConfigUtils.getEnvVariable('MODYS_PASSWORD'),
  study: ConfigUtils.getEnvVariable('MODYS_STUDY'),
  identifierTypeId: Number(
    ConfigUtils.getEnvVariable('MODYS_IDENTIFIER_TYPE_ID')
  ),
};
const DEFAULT_MODYS_REQUEST_CONCURRENCY = '5';

const conf = {
  public: GlobalConfig.getPublic('modysservice'),
  services: {
    personaldataservice: GlobalConfig.personaldataservice,
    userservice: GlobalConfig.userservice,
  },
  modys: modysConfig,
  modysRequestConcurrency: Number(
    ConfigUtils.getEnvVariable(
      'MODYS_REQUEST_CONCURRENCY',
      DEFAULT_MODYS_REQUEST_CONCURRENCY
    )
  ),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

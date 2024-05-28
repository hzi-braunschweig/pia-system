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

let fixedSormasServer: string = ConfigUtils.getEnvVariable('SORMAS_SERVER_URL');
if (fixedSormasServer && !fixedSormasServer.includes('://')) {
  fixedSormasServer = 'https://' + fixedSormasServer;
}
if (fixedSormasServer.endsWith('/')) {
  fixedSormasServer = fixedSormasServer.substr(0, fixedSormasServer.length - 1);
}

const conf = {
  public: GlobalConfig.getPublic('sormasservice'),
  database: {
    host: ConfigUtils.getEnvVariable('DB_SORMAS_HOST'),
    port: Number(ConfigUtils.getEnvVariable('DB_SORMAS_PORT')),
    user: ConfigUtils.getEnvVariable('DB_SORMAS_USER'),
    password: ConfigUtils.getEnvVariable('DB_SORMAS_PASSWORD'),
    database: ConfigUtils.getEnvVariable('DB_SORMAS_DB'),
  },
  services: {
    userservice: GlobalConfig.userservice,
    personaldataservice: GlobalConfig.personaldataservice,
    questionnaireservice: GlobalConfig.questionnaireservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('sormasservice'),
  },
  probandAppUrl: GlobalConfig.probandAppUrl,
  sormas: {
    url: fixedSormasServer,
    username: ConfigUtils.getEnvVariable('PIA_ON_SORMAS_USER'),
    password: ConfigUtils.getEnvVariable('PIA_ON_SORMAS_PASSWORD'),
    study: ConfigUtils.getEnvVariable('SORMAS_STUDY'),
  },
  sormasOnPia: {
    username: ConfigUtils.getEnvVariable('SORMAS_ON_PIA_USER'),
    password: ConfigUtils.getEnvVariable('SORMAS_ON_PIA_PASSWORD'),
    // in seconds
    tokenValidity: ConfigUtils.getEnvVariableInt(
      'SORMAS_ON_PIA_TOKEN_VALIDITY_TIMEOUT'
    ),
  },
  verbose: ConfigUtils.getEnvVariable('VERBOSE', 'false') === 'true',
  defaultLanguage: ConfigUtils.getEnvVariable('DEFAULT_LANGUAGE', 'de-DE'),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

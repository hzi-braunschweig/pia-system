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
import { ServiceAccount } from 'firebase-admin/lib/credential';

function getFirebaseCredentials(): ServiceAccount {
  const privateKey = Buffer.from(
    ConfigUtils.getEnvVariable('FIREBASE_PRIVATE_KEY_BASE64'),
    'base64'
  ).toString('utf-8');

  return {
    privateKey,
    clientEmail: ConfigUtils.getEnvVariable('FIREBASE_CLIENT_EMAIL'),
    projectId: ConfigUtils.getEnvVariable('FIREBASE_PROJECT_ID'),
  };
}

const conf = {
  public: GlobalConfig.getPublic('notificationservice'),
  database: GlobalConfig.getQPia(),
  services: {
    userservice: GlobalConfig.userservice,
    personaldataservice: GlobalConfig.personaldataservice,
    questionnaireservice: GlobalConfig.questionnaireservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
    messageQueue: GlobalConfig.getMessageQueue('notificationservice'),
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
  probandAppUrl: GlobalConfig.probandAppUrl,
  adminAppUrl: GlobalConfig.adminAppUrl,
  fireBaseCredentials: getFirebaseCredentials(),
  timeZone: GlobalConfig.timeZone,
  notificationTime: {
    hours: 8, // in the time zone configured above
    minutes: 0,
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

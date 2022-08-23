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
import { ServiceAccount } from 'firebase-admin/lib/credential';

interface FirebaseCredentialsFile {
  project_id: string;
  private_key: string;
  client_email: string;
}

const fbCredentialsFile = JSON.parse(
  ConfigUtils.getFileContent('./firebase/credential.json').toString() || '{}'
) as FirebaseCredentialsFile;

const fireBaseCredentials: ServiceAccount = {
  projectId: fbCredentialsFile.project_id,
  privateKey: fbCredentialsFile.private_key,
  clientEmail: fbCredentialsFile.client_email,
};

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/no.cert'),
  key: ConfigUtils.getFileContent('./ssl/no.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  database: GlobalConfig.getQPia(SSL_CERTS),
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
  fireBaseCredentials: fireBaseCredentials,
  timeZone: GlobalConfig.timeZone,
  notificationTime: {
    hours: 8, // in the time zone configured above
    minutes: 0,
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

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
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  webappUrl: GlobalConfig.webappUrl,
  fireBaseCredentials: fireBaseCredentials,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

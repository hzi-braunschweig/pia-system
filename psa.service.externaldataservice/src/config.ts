import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/ex.cert'),
  key: ConfigUtils.getFileContent('./ssl/ex.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const MODYS_SSL_ENABLED =
  ConfigUtils.getEnvVariable('MODYS_SSL', 'true').toLowerCase() !== 'false';
console.log(`SSL to modys is ${MODYS_SSL_ENABLED ? 'enabled' : 'disabled'}`);

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  modys: {
    host: ConfigUtils.getEnvVariable('MODYS_HOST'),
    port: ConfigUtils.getEnvVariable('MODYS_PORT', '3308'),
    user: ConfigUtils.getEnvVariable('MODYS_USER'),
    password: ConfigUtils.getEnvVariable('MODYS_PASSWORD'),
    database: ConfigUtils.getEnvVariable('MODYS_DB'),
    ssl: MODYS_SSL_ENABLED && {
      rejectUnauthorized: true,
      cert: ConfigUtils.getFileContent('./ssl/modysClient.cert'),
      key: ConfigUtils.getFileContent('./ssl/modysClient.key'),
      ca: ConfigUtils.getFileContent('./ssl/modysCa.cert'),
      minVersion: 'TLSv1',
    },
  },
  services: {
    personaldataservice: GlobalConfig.personaldataservice,
    userservice: GlobalConfig.userservice,
  },
  studyToImport: 'ZIFCO-Studie',
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

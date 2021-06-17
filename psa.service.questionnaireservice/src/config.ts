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
  public: GlobalConfig.getPublic(SSL_CERTS),
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    loggingservice: GlobalConfig.loggingservice,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

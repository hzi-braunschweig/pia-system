import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/an.cert'),
  key: ConfigUtils.getFileContent('./ssl/an.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    sormasservice: GlobalConfig.sormasservice,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  isSormasActive: GlobalConfig.isSormasActive,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

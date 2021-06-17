import { GlobalConfig, ServiceConfig } from '../../src';

const dummySslCerts = {
  cert: new Buffer(''),
  key: new Buffer(''),
  ca: new Buffer(''),
};

export const config: ServiceConfig = {
  public: GlobalConfig.getPublic(dummySslCerts),
  internal: GlobalConfig.internal,
  database: GlobalConfig.getQPia(dummySslCerts),
  services: {
    authservice: GlobalConfig.authservice,
    loggingservice: GlobalConfig.loggingservice,
    userservice: GlobalConfig.userservice,
    personaldataservice: GlobalConfig.personaldataservice,
    sormasservice: GlobalConfig.sormasservice,
  },
  servers: {
    mailserver: GlobalConfig.mailserver,
  },
  isSormasActive: GlobalConfig.isSormasActive,
  webappUrl: GlobalConfig.webappUrl,
  publicAuthKey: GlobalConfig.publicAuthKey,
};

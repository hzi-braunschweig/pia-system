import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';
import { SftpConfig } from './models/sftpConfig';

const mhhftpserver: SftpConfig = {
  host: ConfigUtils.getEnvVariable('MHH_FTPSERVICE_HOST'),
  port: Number(ConfigUtils.getEnvVariable('MHH_FTPSERVICE_PORT')),
  username: ConfigUtils.getEnvVariable('MHH_FTPSERVICE_USER'),
  password: ConfigUtils.getEnvVariable('MHH_FTPSERVICE_PW'),
};
const hziftpserver: SftpConfig = {
  host: ConfigUtils.getEnvVariable('HZI_FTPSERVICE_HOST'),
  port: Number(ConfigUtils.getEnvVariable('HZI_FTPSERVICE_PORT')),
  username: ConfigUtils.getEnvVariable('HZI_FTPSERVICE_USER'),
  password: ConfigUtils.getEnvVariable('HZI_FTPSERVICE_PW'),
};

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/sa.cert'),
  key: ConfigUtils.getFileContent('./ssl/sa.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

const conf = {
  public: GlobalConfig.getPublic(SSL_CERTS),
  database: GlobalConfig.getQPia(SSL_CERTS),
  services: {
    complianceservice: GlobalConfig.complianceservice,
    userservice: GlobalConfig.userservice,
  },
  servers: {
    mhhftpserver: mhhftpserver,
    hziftpserver: hziftpserver,
  },
  publicAuthKey: GlobalConfig.publicAuthKey,
  webappUrl: GlobalConfig.webappUrl,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

import {
  ConfigUtils,
  GlobalConfig,
  SslCerts,
  SupersetOfServiceConfig,
} from '@pia/lib-service-core';
import { ModysConfig } from './models/modys';

const SSL_CERTS: SslCerts = {
  cert: ConfigUtils.getFileContent('./ssl/modys.cert'),
  key: ConfigUtils.getFileContent('./ssl/modys.key'),
  ca: ConfigUtils.getFileContent('./ssl/ca.cert'),
};

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
  public: GlobalConfig.getPublic(SSL_CERTS),
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

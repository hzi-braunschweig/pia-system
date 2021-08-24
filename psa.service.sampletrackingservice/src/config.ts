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
import { SftpConfig } from './models/sftpConfig';

const OLD_SSH2_KEX = [
  // https://tools.ietf.org/html/rfc5656#section-10.1
  'ecdh-sha2-nistp256',
  'ecdh-sha2-nistp384',
  'ecdh-sha2-nistp521',

  // https://tools.ietf.org/html/rfc4419#section-4
  'diffie-hellman-group-exchange-sha256',

  // https://tools.ietf.org/html/rfc8268
  'diffie-hellman-group14-sha256',
  'diffie-hellman-group15-sha512',
  'diffie-hellman-group16-sha512',
  'diffie-hellman-group17-sha512',
  'diffie-hellman-group18-sha512',

  // Outdated KEX - just temporary because of connection issues to server
  'diffie-hellman-group1-sha1',
  'diffie-hellman-group14-sha1',
];

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

// Use outdated KEX - just temporary because of connection issues to server
if (
  ConfigUtils.getEnvVariable(
    'MHH_FTPSERVICE_ALLOW_OLD_SSH2_KEX',
    'false'
  ).toLowerCase() === 'true'
) {
  conf.servers.mhhftpserver = {
    ...conf.servers.mhhftpserver,
    ...{
      algorithms: {
        kex: OLD_SSH2_KEX,
      },
    },
  };
}

if (
  ConfigUtils.getEnvVariable(
    'HZI_FTPSERVICE_ALLOW_OLD_SSH2_KEX',
    'false'
  ).toLowerCase() === 'true'
) {
  conf.servers.hziftpserver = {
    ...conf.servers.hziftpserver,
    ...{
      algorithms: {
        kex: OLD_SSH2_KEX,
      },
    },
  };
}

export const config: SupersetOfServiceConfig<typeof conf> = conf;

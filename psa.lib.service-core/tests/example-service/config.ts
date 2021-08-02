/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

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

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { GlobalConfig, SupersetOfServiceConfig } from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('sampletrackingservice'),
  internal: GlobalConfig.getInternal('sampletrackingservice'),
  database: GlobalConfig.getQPia(),
  services: {
    complianceservice: GlobalConfig.complianceservice,
    userservice: GlobalConfig.userservice,
  },
  servers: {
    authserver: {
      probandTokenIntrospectionClient:
        GlobalConfig.authserver.probandTokenIntrospectionClient,
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
    },
  },
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

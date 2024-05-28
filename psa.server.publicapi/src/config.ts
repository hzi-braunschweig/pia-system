/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { GlobalConfig, SupersetOfServiceConfig } from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('publicapiserver'),
  servers: {
    authserver: {
      adminTokenIntrospectionClient:
        GlobalConfig.authserver.adminTokenIntrospectionClient,
      adminManagementClient: GlobalConfig.authserver.adminManagementClient,
    },
  },
  isDevelopmentSystem: GlobalConfig.isDevelopmentSystem(),
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { GlobalConfig, SupersetOfServiceConfig } from '@pia/lib-service-core';

const conf = {
  public: GlobalConfig.getPublic('jobschedulerserver'),
  servers: {
    messageQueue: GlobalConfig.getMessageQueue('jobschedulerserver'),
  },
  timeZone: GlobalConfig.timeZone,
};

export const config: SupersetOfServiceConfig<typeof conf> = conf;

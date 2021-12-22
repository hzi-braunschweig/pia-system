/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { config } from '../config';
import { AuthserviceClient } from '@pia-system/lib-http-clients-internal';

export const authserviceClient = new AuthserviceClient(
  config.services.authservice.url
);

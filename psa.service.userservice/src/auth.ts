/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Hapi from '@hapi/hapi';
import { config } from './config';
import { AccessToken, PublicApiAuthenticator } from '@pia/lib-service-core';

export const hapiAuthentication = async (
  request: Hapi.Request,
  securityName: string
): Promise<AccessToken> =>
  await PublicApiAuthenticator.authenticate(
    securityName,
    request,
    config.servers.authserver.adminTokenIntrospectionClient
  );

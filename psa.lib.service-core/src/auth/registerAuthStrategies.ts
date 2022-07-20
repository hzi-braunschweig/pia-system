/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Server } from '@hapi/hapi';
import { AuthSettings } from '../config/configModel';
import authKeycloak from 'hapi-auth-keycloak';

/**
 * Registers AuthStrategies for proband and/or admin realm
 *
 * Uses hapi-auth-keycloak's 'keycloak-jwt' auth scheme.
 *
 * IMPORTANT:
 * hapi-auth-keycloak needs `NODE_ENV=test` to be set for test
 * execution. Otherwise, tests will fail as soon as they start
 * multiple servers within one NodeJS process (which is
 * usually the case).
 *
 * @param server
 * @param authSettings
 */
export async function registerAuthStrategies(
  server: Server,
  authSettings: AuthSettings
): Promise<void> {
  if (
    !authSettings.probandTokenIntrospectionClient &&
    !authSettings.adminTokenIntrospectionClient
  ) {
    console.warn(
      'registerAuthStrategies() was called without valid realm configuration!'
    );
    console.warn('Did not register any auth strategy');
    return;
  }

  const userInfo = ['username', 'studies'];
  await server.register({ plugin: authKeycloak });

  if (authSettings.probandTokenIntrospectionClient) {
    server.auth.strategy('jwt-proband', 'keycloak-jwt', {
      name: 'jwt-proband',
      userInfo,
      realmUrl: `${authSettings.probandTokenIntrospectionClient.connection.url}/realms/${authSettings.probandTokenIntrospectionClient.realm}`,
      clientId: authSettings.probandTokenIntrospectionClient.clientId,
      secret: authSettings.probandTokenIntrospectionClient.secret,
    });
    console.info('Registered "jwt-proband" auth strategy');
  }
  if (authSettings.adminTokenIntrospectionClient) {
    server.auth.strategy('jwt-admin', 'keycloak-jwt', {
      name: 'jwt-admin',
      userInfo,
      realmUrl: `${authSettings.adminTokenIntrospectionClient.connection.url}/realms/${authSettings.adminTokenIntrospectionClient.realm}`,
      clientId: authSettings.adminTokenIntrospectionClient.clientId,
      secret: authSettings.adminTokenIntrospectionClient.secret,
    });
    console.info('Registered "jwt-admin" auth strategy');
  }
}

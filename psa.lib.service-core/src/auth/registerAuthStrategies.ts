/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Server } from '@hapi/hapi';
import HapiAuthJwt2 from 'hapi-auth-jwt2';
import { IDatabase } from 'pg-promise';

import { validateAccessToken } from './strategies/validateAccessToken';
import { validateLoginToken } from './strategies/validateLoginToken';

export type AuthStrategy = 'jwt' | 'jwt_login';

export interface AuthStrategyOptions {
  strategies: AuthStrategy[];
  publicAuthKey?: Buffer;
  db?: IDatabase<unknown>;
}

export const registerAuthStrategies = async (
  server: Server,
  options: AuthStrategyOptions
): Promise<void> => {
  if (!options.strategies.length) {
    throw new Error('registerAuthStrategies: No auth strategies defined!');
  }
  if (!options.publicAuthKey) {
    throw new Error('registerAuthStrategies: No public auth key defined!');
  }
  if (
    options.strategies.includes('jwt') ||
    options.strategies.includes('jwt_login')
  ) {
    await server.register(HapiAuthJwt2);
  }

  if (options.strategies.includes('jwt')) {
    server.auth.strategy('jwt', 'jwt', {
      key: options.publicAuthKey,
      verifyOptions: {
        algorithms: ['RS512'],
      },
      validate: validateAccessToken(options.db),
    });
  }
  if (options.strategies.includes('jwt_login')) {
    server.auth.strategy('jwt_login', 'jwt', {
      key: options.publicAuthKey,
      verifyOptions: {
        algorithms: ['RS512'],
      },
      validate: validateLoginToken(options.db),
    });
  }
};

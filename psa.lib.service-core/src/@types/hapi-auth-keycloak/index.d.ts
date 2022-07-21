/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

declare module 'hapi-auth-keycloak' {
  /**
   * The configuration of an optional api key strategy interaction with another service
   */
  export interface PluginOptions {
    apiKey: {
      /**
       * Whether the api key is placed in the headers or query
       * @default 'headers'
       * @example 'query'
       */
      in?: 'headers' | 'query';
      /**
       * The name of the related headers field or query key
       * @default 'authorization'
       * @example 'x-api-key'
       */
      name: string;
      /**
       * An optional prefix of the related api key value
       * @default 'Api-Key '
       * @example 'Apikey ',
       */
      prefix?: string;

      /**
       * The absolute url to be requested
       * @example 'https://foobar.com/api',
       */
      url: string;
      /**
       * The detailed request options for got
       * @default {}
       * @example { retries: 2 }
       */
      request: Record<string, unknown>;
      /**
       * The path to the access token in the response its body as dot notation
       * @default 'access_token'
       * @example 'foo.bar'
       */
      tokenPath?: string;
    };
  }

  export function register(server: Hapi.Server, opts: PluginOptions);

  export const pkg: unknown;
}

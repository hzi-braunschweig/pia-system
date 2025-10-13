/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Hapi, { AppCredentials, Auth, UserCredentials } from '@hapi/hapi';
import { config } from './config';
import {
  AccessToken,
  assertStudyAccess,
  hasRealmRole,
  PublicApiAuthenticator,
} from '@pia/lib-service-core';
import Boom from '@hapi/boom';
import { ExportPayload } from './handlers/exportHandler';
import { ExportOptions } from './interactors/exportInteractor';

export const hapiAuthentication = async (
  request: Hapi.Request,
  securityName: string
): Promise<AccessToken> =>
  await PublicApiAuthenticator.authenticate(
    securityName,
    request,
    config.servers.authserver.adminTokenIntrospectionClient
  );

/**
 * register a custom payload auth scheme to authenticate via tokens in payload
 * instead of tokens in the header
 * used in the export route
 * @param server
 */
export const registerPayloadAuthStrategy = (server: Hapi.Server): void => {
  server.auth.scheme('payload-scheme', () => {
    return {
      authenticate: function (
        _request,
        h
      ): Auth<
        UserCredentials,
        AppCredentials,
        Record<string, unknown>,
        Record<string, unknown>
      > {
        return h.authenticated({
          credentials: {},
        });
      },
      payload: async function (
        request,
        h
      ): Promise<Hapi.Lifecycle.ReturnValue> {
        const payload = request.payload as Omit<
          ExportPayload,
          'exportOptions'
        > & { exportOptions: string };

        request.headers['authorization'] = `Bearer ${payload.token}`;
        const credentials = await request.server.auth.test(
          'jwt-admin',
          request
        );

        if (!hasRealmRole('Forscher', credentials.credentials)) {
          throw Boom.forbidden('wrong realm role');
        }

        let exportOptions: ExportOptions | undefined;
        try {
          exportOptions = JSON.parse(payload.exportOptions) as ExportOptions;
        } catch (e) {
          throw Boom.badRequest('could not parse export options');
        }

        assertStudyAccess(
          exportOptions.study_name,
          credentials.credentials as AccessToken
        );

        return h.continue;
      },
      options: {
        payload: true,
      },
    };
  });
  server.auth.strategy('payload', 'payload-scheme');
};

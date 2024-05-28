/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { Authserver } from './authserver';

export class PublicApiServer extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      authServer,
    }: {
      authServer: Authserver;
    }
  ) {
    super(
      scope,
      configuration,
      'publicapiserver',
      {
        AUTHSERVER_PORT: authServer.service.port,
        AUTHSERVER_ADMIN_MANAGEMENT_CLIENT_SECRET:
          configuration.variables.authserver.adminManagementClientSecret,
        AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
          configuration.variables.authserver
            .adminTokenIntrospectionClientSecret,
      },
      {
        image: 'psa.server.publicapi',
      }
    );
  }
}

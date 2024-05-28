/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StatusCodes } from 'http-status-codes';
import { ResponseRouteConfig } from './responseRoute';

/**
 * The following Keycloak paths, such as the management console path,
 * are not exposed on production systems.
 *
 * @see {@link https://www.keycloak.org/server/reverseproxy|Exposed path recommendations}
 */
export const nonExposedKeycloakPaths: ResponseRouteConfig[] = [
  notFoundResponseRoute('/api/v1/auth/admin/'),
  notFoundResponseRoute('/api/v1/auth/welcome/'),
  notFoundResponseRoute('/api/v1/auth/realms/master/metrics'),
  notFoundResponseRoute('/api/v1/auth/realms/pia-proband-realm/metrics'),
  notFoundResponseRoute('/api/v1/auth/realms/pia-admin-realm/metrics'),
  notFoundResponseRoute('/api/v1/auth/health'),
  notFoundResponseRoute('/admin/api/v1/auth/admin/'),
  notFoundResponseRoute('/admin/api/v1/auth/welcome/'),
  notFoundResponseRoute('/admin/api/v1/auth/metrics'),
  notFoundResponseRoute('/admin/api/v1/auth/health'),
];

function notFoundResponseRoute(path: string): ResponseRouteConfig {
  return {
    path,
    response: {
      statusCode: StatusCodes.NOT_FOUND,
    },
  };
}

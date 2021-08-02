/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ConfigRoute {
  /**
   * specifies the path of the route
   */
  path: string;
  /**
   * if enable only `additionalPaths` will be configured as ingress (and not the `path`)
   */
  skipBasePath?: boolean;
  /**
   * specifies additional paths for the route that should be mapped
   */
  additionalPaths?: string[];
  /**
   * specifies the name of the backend service
   */
  serviceName: string;
  /**
   * specifies if the service should only be accessed using http
   */
  isHttpOnly: boolean;
  /**
   * specifies if the route should only be added on development systems
   */
  isOnlyOnDevelopmentSystems: boolean;
  /** specifies if a special host name should be used to reach the service.
   * if not specified the serviceName is used
   */
  host?: string;
  /** specifies if a special port should be used to reach the service.
   * if not specified the default port is used (80 for http, 443 for https)
   */
  port?: number;
}

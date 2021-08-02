/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConfigRoute } from './configRoute';
import { ProxyRoute } from './proxyRoute';

export interface IOptions {
  isDevelopmentSystem: boolean;
  isSslEnabled: boolean;
  defaultPort?: number;
}

const HTTP_PORT = 80;
const HTTPS_PORT = 443;

export class RouteMapper {
  public static mapConfigRoutes(
    routes: ConfigRoute[],
    options: IOptions
  ): ProxyRoute[] {
    const result: ProxyRoute[] = [];
    for (const route of routes) {
      if (route.isOnlyOnDevelopmentSystems && !options.isDevelopmentSystem) {
        continue;
      }

      const routeHasSsl = options.isSslEnabled && !route.isHttpOnly;
      const defaultProtocolPort = routeHasSsl ? HTTPS_PORT : HTTP_PORT;
      const defaultPort =
        typeof options.defaultPort !== 'undefined'
          ? options.defaultPort
          : defaultProtocolPort;

      const port = typeof route.port !== 'undefined' ? route.port : defaultPort;
      const host =
        typeof route.host !== 'undefined' ? route.host : route.serviceName;
      const path = route.path;
      const protocol: 'https' | 'http' = routeHasSsl ? 'https' : 'http';

      const upstream = {
        serviceName: route.serviceName,
        host,
        port,
        path,
        protocol,
      };

      if (route.skipBasePath !== true) {
        result.push({
          upstream,
          path: route.path,
        });
      }

      for (const additionalPath of route.additionalPaths ?? []) {
        result.push({
          upstream,
          path: additionalPath + route.path,
        });
      }
    }
    return result;
  }

  /**
   * takes care that the most specific routes are listed (and matched) first
   **/
  public static sortRoutes(routes: ProxyRoute[]): ProxyRoute[] {
    routes.sort((a, b) => {
      return b.path.length - a.path.length;
    });
    return routes;
  }

  /**
   * takes care that there are no duplicate routes
   **/
  public static checkRoutes(routes: ProxyRoute[]): ProxyRoute[] {
    for (const route of routes) {
      if (routes.filter((r) => r.path === route.path).length !== 1) {
        throw new Error(`duplicate route: ${route.path}`);
      }
    }
    return routes;
  }
}

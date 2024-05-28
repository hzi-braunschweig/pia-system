/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Route, RouteConfig } from './route';
import { ProxyRoute } from './proxyRoute';
import { ResponseRoute } from './responseRoute';

export class RouteHelper {
  public static createRoutefromConfig(route: RouteConfig): Route {
    if (ProxyRoute.isConfig(route)) {
      return new ProxyRoute(route);
    } else if (ResponseRoute.isConfig(route)) {
      return new ResponseRoute(route);
    } else {
      throw new Error('Unknown route config type');
    }
  }

  /**
   * Takes care that the most specific routes are listed (and matched) first
   **/
  public static sort(routes: RouteConfig[]): RouteConfig[] {
    routes.sort((a, b) => {
      return b.path.length - a.path.length;
    });
    return routes;
  }

  /**
   * Takes care that there are no duplicate routes
   **/
  public static assertNoDuplicates(routes: RouteConfig[]): RouteConfig[] {
    for (const route of routes) {
      if (routes.filter((r) => r.path === route.path).length !== 1) {
        throw new Error(`duplicate route: ${route.path}`);
      }
    }
    return routes;
  }
}

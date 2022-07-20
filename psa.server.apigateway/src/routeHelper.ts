/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Route } from './proxyRoute';

export class RouteHelper {
  /**
   * takes care that the most specific routes are listed (and matched) first
   **/
  public static sortRoutes(routes: Route[]): Route[] {
    routes.sort((a, b) => {
      return b.path.length - a.path.length;
    });
    return routes;
  }

  /**
   * takes care that there are no duplicate routes
   **/
  public static checkRoutes(routes: Route[]): Route[] {
    for (const route of routes) {
      if (routes.filter((r) => r.path === route.path).length !== 1) {
        throw new Error(`duplicate route: ${route.path}`);
      }
    }
    return routes;
  }
}

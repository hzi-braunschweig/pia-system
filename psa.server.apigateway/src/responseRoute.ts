/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Route, RouteConfig } from './route';

export interface ResponseConfig {
  headers?: Record<string, string>;
  body?: string;
  statusCode?: number;
}

export interface ResponseRouteConfig extends RouteConfig {
  response: ResponseConfig;
}

export class ResponseRoute extends Route implements ResponseRouteConfig {
  public readonly response: ResponseConfig;

  public constructor(route: ResponseRouteConfig) {
    super(route.path);
    this.response = route.response;
  }

  public static isConfig(route: unknown): route is ResponseRouteConfig {
    return (
      Route.isConfig(route) &&
      typeof (route as ResponseRouteConfig).response === 'object'
    );
  }

  public matches(path: string): boolean {
    return path === this.path;
  }
}

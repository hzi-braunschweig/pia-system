/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Upstream {
  host: string;
  port: number;
  path: string;
  protocol: 'http' | 'https';
}

export type Route = ProxyRoute | ResponseRoute;

interface IRoute {
  path: string;
}

export function isRoute(route: unknown): route is IRoute {
  return !!route && typeof (route as Partial<IRoute>).path === 'string';
}

export interface ProxyRoute extends IRoute {
  upstream: Upstream;
}
export function isProxyRoute(route: unknown): route is ProxyRoute {
  return isRoute(route) && typeof (route as ProxyRoute).upstream === 'object';
}

export interface ResponseRoute extends IRoute {
  response: {
    headers?: Record<string, string>;
    body?: string;
    statusCode?: number;
  };
}
export function isResponseRoute(route: unknown): route is ResponseRoute {
  return (
    isRoute(route) && typeof (route as ResponseRoute).response === 'object'
  );
}

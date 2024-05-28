/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { compile, match, pathToRegexp } from 'path-to-regexp';
import { Route, RouteConfig } from './route';

export interface UpstreamConfig {
  host: string;
  port: number;
  path: string;
}

export interface ProxyRouteConfig extends RouteConfig {
  upstream: UpstreamConfig;
}

export class ProxyRoute extends Route implements ProxyRouteConfig {
  public readonly upstream: UpstreamConfig;

  private readonly pathMatcher: RegExp;

  public constructor(route: ProxyRouteConfig) {
    super(route.path);
    this.upstream = route.upstream;
    this.pathMatcher = pathToRegexp(this.path, [], {
      sensitive: true,
      end: false,
    });
  }

  public static isConfig(route: unknown): route is ProxyRouteConfig {
    return (
      Route.isConfig(route) &&
      typeof (route as ProxyRouteConfig).upstream === 'object'
    );
  }

  public matches(path: string): boolean {
    return this.pathMatcher.test(path);
  }

  public toUpstreamPath(url: URL): string {
    return (
      compile(this.upstream.path, { encode: encodeURIComponent })(
        this.getParams(url.pathname + url.search)
      ) + this.unmatchedRestOfPath(url.pathname)
    );
  }

  public unmatchedRestOfPath(url: string): string {
    const matchedPath = this.pathMatcher.exec(url);
    if (matchedPath?.[0]?.length) {
      const matchedPathLength = matchedPath[0].length;
      return url.slice(matchedPathLength);
    }
    return '';
  }

  private getParams(path: string): Record<string, string> {
    const pathMatch = match<Record<string, string>>(this.path, {
      sensitive: true,
      end: false,
      decode: decodeURIComponent,
    })(path);

    if (!pathMatch) {
      throw new Error('Could not match given path to route');
    }
    return pathMatch.params;
  }
}

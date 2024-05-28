/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface RouteConfig {
  path: string;
}

export abstract class Route implements RouteConfig {
  protected constructor(public readonly path: string) {}

  public static isConfig(route: unknown): route is RouteConfig {
    return (
      route !== null &&
      typeof route === 'object' &&
      typeof (route as { path: unknown }).path === 'string'
    );
  }

  public abstract matches(path: string): boolean;
}

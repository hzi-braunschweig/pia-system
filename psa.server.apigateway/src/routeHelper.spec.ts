/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { RouteHelper } from './routeHelper';
import { ProxyRoute, ProxyRouteConfig } from './proxyRoute';
import { ResponseRoute, ResponseRouteConfig } from './responseRoute';

const defaultRouteConfig: ProxyRouteConfig = {
  path: '/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
  },
};
const adminRouteConfig: ProxyRouteConfig = {
  path: '/admin/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
  },
};
const apiRouteConfig: ProxyRouteConfig = {
  path: '/api/v1/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
  },
};

const responseRouteConfig: ResponseRouteConfig = {
  path: '/api/v1/qwe',
  response: {},
};

describe('RouteHelper', () => {
  it('returns specific route implementations', () => {
    const proxyRoute = RouteHelper.createRoutefromConfig(defaultRouteConfig);
    const responseRoute =
      RouteHelper.createRoutefromConfig(responseRouteConfig);

    expect(proxyRoute).to.be.instanceOf(ProxyRoute);
    expect(responseRoute).to.be.instanceOf(ResponseRoute);
  });

  it('throws if invalid route config was passed', () => {
    expect(() =>
      RouteHelper.createRoutefromConfig({} as ProxyRouteConfig)
    ).to.throw();
  });

  it('sorts routes correctly', () => {
    expect(
      RouteHelper.sort([adminRouteConfig, defaultRouteConfig, apiRouteConfig])
    ).to.deep.equal([apiRouteConfig, adminRouteConfig, defaultRouteConfig]);
  });

  it('checkRoutes throws on duplicates', () => {
    expect(() =>
      RouteHelper.assertNoDuplicates([
        adminRouteConfig,
        defaultRouteConfig,
        adminRouteConfig,
        apiRouteConfig,
      ])
    ).to.throw();
  });

  it('checkRoutes works without duplicates', () => {
    RouteHelper.assertNoDuplicates([
      adminRouteConfig,
      defaultRouteConfig,
      apiRouteConfig,
    ]);
  });
});

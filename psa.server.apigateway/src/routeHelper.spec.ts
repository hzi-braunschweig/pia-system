/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { RouteHelper } from './routeHelper';
import { ProxyRoute } from './proxyRoute';

const defaultRoute: ProxyRoute = {
  path: '/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};
const adminRoute: ProxyRoute = {
  path: '/admin/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};
const apiRoute: ProxyRoute = {
  path: '/api/v1/qwe',
  upstream: {
    host: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};

describe('RouteHelper', () => {
  it('sorts routes correctly', () => {
    expect(
      RouteHelper.sortRoutes([adminRoute, defaultRoute, apiRoute])
    ).to.deep.equal([apiRoute, adminRoute, defaultRoute]);
  });

  it('checkRoutes throws on duplicates', () => {
    expect(() =>
      RouteHelper.checkRoutes([adminRoute, defaultRoute, adminRoute, apiRoute])
    ).to.throw();
  });

  it('checkRoutes works without duplicates', () => {
    RouteHelper.checkRoutes([adminRoute, defaultRoute, apiRoute]);
  });
});

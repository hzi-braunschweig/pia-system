/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';

import { RouteMapper } from './routeMapper';
import { ProxyRoute } from './proxyRoute';

const adminPath = '/admin';
const apiPath = '/api/v1';

const defaultRoute: ProxyRoute = {
  path: '/qwe',
  upstream: {
    host: 'test',
    serviceName: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};
const adminRoute: ProxyRoute = {
  path: '/admin/qwe',
  upstream: {
    host: 'test',
    serviceName: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};
const apiRoute: ProxyRoute = {
  path: '/api/v1/qwe',
  upstream: {
    host: 'test',
    serviceName: 'test',
    port: 80,
    path: '/qwe',
    protocol: 'http',
  },
};
const defaultRouteHttps: ProxyRoute = {
  path: '/qwe',
  upstream: {
    host: 'test',
    serviceName: 'test',
    port: 443,
    path: '/qwe',
    protocol: 'https',
  },
};

describe('RouteMapper', () => {
  it('should filter routes for development systems', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: true,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [apiPath, adminPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([]);
  });

  it('should add routes for development systems', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: true,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
          },
        ],
        {
          isDevelopmentSystem: true,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([defaultRoute]);
  });

  it('should add https route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: true,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: false,
          },
        ],
        {
          isDevelopmentSystem: true,
          isSslEnabled: true,
        }
      )
    ).to.deep.equal([defaultRouteHttps]);
  });

  it('should add http route on ssl', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: true,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
          },
        ],
        {
          isDevelopmentSystem: true,
          isSslEnabled: true,
        }
      )
    ).to.deep.equal([defaultRoute]);
  });

  it('should add admin route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [adminPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([defaultRoute, adminRoute]);
  });

  it('should add api route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [apiPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([defaultRoute, apiRoute]);
  });

  it('should add admin and api route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [adminPath, apiPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([defaultRoute, adminRoute, apiRoute]);
  });

  it('should add admin and api route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [adminPath, apiPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([defaultRoute, adminRoute, apiRoute]);
  });

  it('should use a explicit specified port', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [],
            port: 1234,
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([
      {
        path: '/qwe',
        upstream: {
          host: 'test',
          serviceName: 'test',
          port: 1234,
          path: '/qwe',
          protocol: 'http',
        },
      },
    ]);
  });

  it('should use a explicit specified host', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [],
            host: 'myCustomHost',
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([
      {
        path: '/qwe',
        upstream: {
          host: 'myCustomHost',
          serviceName: 'test',
          port: 80,
          path: '/qwe',
          protocol: 'http',
        },
      },
    ]);
  });

  it('should not add base path route', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            skipBasePath: true,
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [adminPath, apiPath],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
        }
      )
    ).to.deep.equal([adminRoute, apiRoute]);
  });

  it('should use defaultPort from options', () => {
    expect(
      RouteMapper.mapConfigRoutes(
        [
          {
            isOnlyOnDevelopmentSystems: false,
            path: '/qwe',
            serviceName: 'test',
            isHttpOnly: true,
            additionalPaths: [],
          },
        ],
        {
          isDevelopmentSystem: false,
          isSslEnabled: false,
          defaultPort: 1234,
        }
      )
    ).to.deep.equal([
      {
        path: '/qwe',
        upstream: {
          host: 'test',
          serviceName: 'test',
          port: 1234,
          path: '/qwe',
          protocol: 'http',
        },
      },
    ]);
  });

  it('sorts routes correctly', () => {
    expect(
      RouteMapper.sortRoutes([adminRoute, defaultRoute, apiRoute])
    ).to.deep.equal([apiRoute, adminRoute, defaultRoute]);
  });

  it('checkRoutes throws on duplicates', () => {
    expect(() =>
      RouteMapper.checkRoutes([adminRoute, defaultRoute, adminRoute, apiRoute])
    ).to.throw();
  });

  it('checkRoutes works without duplicates', () => {
    RouteMapper.checkRoutes([adminRoute, defaultRoute, apiRoute]);
  });
});

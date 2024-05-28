/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proxy } from './proxy';
import { HttpServer } from './httpServer';
import config from './config';
import { Color } from './color';
import { RedirectHttpToHttpsServer } from './redirectHttpToHttpsServer';
import { ProxyRoute } from './proxyRoute';
import { ResponseRoute } from './responseRoute';
import { RouteHelper } from './routeHelper';
import { StatusCodes } from 'http-status-codes';

const HTTP_PORT = 80;

const isExternalSslEnabled = config.web.external.protocol !== 'http';

const routes = RouteHelper.sort([...config.responseRoutes, ...config.routes]);

RouteHelper.assertNoDuplicates(routes);

console.log(`system.isDevelopment=${Color.bool(config.system.isDevelopment)}`);

for (const route of routes) {
  if (ResponseRoute.isConfig(route)) {
    const statusCode = route.response.statusCode ?? StatusCodes.OK;
    console.log(
      `routing ${Color.route(route.path)} -> StatusCode=${Color.statusCode(
        statusCode
      )}`
    );
  }

  if (!ProxyRoute.isConfig(route)) continue;

  const target = [
    Color.protocol('http'),
    '://',
    Color.serviceName(route.upstream.host),
    ':',
    route.upstream.port,
    Color.route(route.upstream.path),
  ].join('');
  console.log(`routing ${Color.route(route.path)} -> ${target}`);
}

const servers: HttpServer<unknown>[] = [];

const proxy = new Proxy(routes, false, config.web.headers);

proxy.listen(config.web.external.port).catch((error) => {
  console.error(error);
});
servers.push(proxy);

if (isExternalSslEnabled) {
  const redirectingHttpServer = new RedirectHttpToHttpsServer();
  redirectingHttpServer.listen(HTTP_PORT).catch((error) => {
    console.error(error);
  });
  servers.push(redirectingHttpServer);
}

const stop = (): void => {
  console.log('SIGINT/SIGTERM received -> cleaning up...');
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);

  for (const server of servers) {
    server.close().catch((error) => {
      console.error(error);
    });
  }
};

process.addListener('SIGINT', stop);
process.addListener('SIGTERM', stop);

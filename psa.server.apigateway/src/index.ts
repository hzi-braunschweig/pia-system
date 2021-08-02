/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proxy } from './proxy';
import { ISsl, HttpServer } from './httpServer';
import config from './config';
import { RouteMapper } from './routeMapper';
import { Color } from './color';
import { RedirectingHttpServer } from './redirectingHttpServer';
import * as fs from 'fs';

const HTTP_PORT = 80;

const isInternalSslEnabled = config.web.internal.protocol !== 'http';
const isExternalSslEnabled = config.web.external.protocol !== 'http';

const routes = RouteMapper.sortRoutes(
  RouteMapper.mapConfigRoutes(config.routes, {
    isDevelopmentSystem: config.system.isDevelopment,
    isSslEnabled: isInternalSslEnabled,
    defaultPort: config.web.internal.port,
  })
);

RouteMapper.checkRoutes(routes);

const externalSsl: ISsl | undefined = isExternalSslEnabled
  ? {
      cert: fs.readFileSync(config.web.external.ssl.certificate),
      key: fs.readFileSync(config.web.external.ssl.key),
    }
  : undefined;

const internalCa: Buffer | undefined = isInternalSslEnabled
  ? fs.readFileSync(config.web.internal.ssl.ca)
  : undefined;

console.log(
  `ssl: external=${Color.bool(!!externalSsl)}, internal=${Color.bool(
    !!internalCa
  )}`
);

for (const route of routes) {
  const target = [
    Color.protocol(route.upstream.protocol),
    '://',
    Color.serviceName(route.upstream.serviceName),
    route.upstream.serviceName !== route.upstream.host
      ? `[@${Color.serviceName(route.upstream.host)}]`
      : '',
    ':',
    route.upstream.port,
    Color.route(route.upstream.path),
  ].join('');
  console.log(`routing ${Color.route(route.path)} -> ${target}`);
}

const servers: HttpServer<unknown>[] = [];

const proxy = new Proxy(
  routes,
  externalSsl,
  internalCa,
  false,
  config.web.headers
);

proxy.listen(config.web.external.port).catch((error) => {
  console.error(error);
});
servers.push(proxy);

if (isExternalSslEnabled) {
  const redirectingHttpServer = new RedirectingHttpServer();
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

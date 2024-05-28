/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as http from 'http';
import { createProxyServer } from 'http-proxy';
import { StatusCodes } from 'http-status-codes';
import * as net from 'net';
import { Color } from './color';
import { Header, Headers } from './headers';

import { HttpServer } from './httpServer';
import { Logging } from './logging';
import { ProxyRoute, ProxyRouteConfig } from './proxyRoute';
import { ResponseRoute } from './responseRoute';
import { Route, RouteConfig } from './route';
import { RouteHelper } from './routeHelper';

interface Context {
  received: number;
  route: ProxyRouteConfig;
}

export class Proxy extends HttpServer<Context> {
  private static readonly BASE = 'http://localhost';
  private readonly proxy = createProxyServer({
    xfwd: true,
  });
  private readonly routes: Route[];

  public constructor(
    routes: RouteConfig[],
    private readonly disableLogging: boolean = false,
    private readonly headers?: Headers
  ) {
    super();

    this.routes = routes.map((config) =>
      RouteHelper.createRoutefromConfig(config)
    );

    this.proxy.on('end', (req, _res, proxyRes) => {
      this.handleEnd(req, proxyRes);
    });
  }

  public logStatus(
    req: http.IncomingMessage,
    statusCode: number,
    err?: Error
  ): void {
    if (this.disableLogging) {
      return;
    }

    const context = this.getContext(req);
    const elapsed = Date.now() - (context.received ?? 0);
    const host = context.route ? context.route.upstream.host : '';
    console.log(
      `${Logging.colorizeStatus(statusCode)}: ${req.method ?? 'MISSING'} ${
        req.url ?? 'MISSING'
      } @ ${Color.serviceName(host)} [${elapsed}] ${
        err ? Color.error(err.message) : ''
      }`
    );
  }

  protected handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    try {
      const route = this.routes.find((r) => r.matches(req.url ?? ''));
      if (route instanceof ProxyRoute) {
        this.handleProxyRoute(route, req, res);
      } else if (route instanceof ResponseRoute) {
        this.handleResponseRoute(route, req, res);
      } else {
        res.statusCode = StatusCodes.NOT_FOUND;
        res.end();
      }
    } catch (e) {
      res.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      res.end();

      this.logStatus(req, res.statusCode, e instanceof Error ? e : undefined);
    }
  }

  private handleResponseRoute(
    route: ResponseRoute,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    if (req.method === 'OPTIONS') {
      // cors config
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Accept,Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.setHeader('Content-Length', '0');
      res.statusCode = StatusCodes.NO_CONTENT;
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      for (const [key, value] of Object.entries(route.response.headers ?? {})) {
        res.setHeader(key, value);
      }
      if (route.response.body) {
        res.write(route.response.body);
      }
      res.statusCode = route.response.statusCode ?? StatusCodes.OK;
    }
    res.end();
    this.logStatus(req, res.statusCode);
  }

  private handleProxyRoute(
    route: ProxyRoute,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const url = new URL(req.url ?? '', Proxy.BASE);
    url.pathname = route.toUpstreamPath(url);
    req.url = url.pathname + url.search;

    const context = this.getContext(req);
    context.received = Date.now();
    context.route = route;

    if (this.headers) {
      Header.addHeaders(res, this.headers);
    }

    this.proxy.web(
      req,
      res,
      {
        // changes the origin of the host header to the target URL
        // required for successful SSL verification
        changeOrigin: true,
        target: {
          host: route.upstream.host,
          port: route.upstream.port,
          hostname: route.upstream.host,
          protocol: 'http:',
        },
      },
      (err, proxyReq, proxyRes) => {
        this.handleError(err, proxyReq, proxyRes);
      }
    );
  }

  private handleError(
    err: Error,
    req: http.IncomingMessage,
    res: http.ServerResponse | net.Socket
  ): void {
    if (res instanceof http.ServerResponse) {
      res.statusCode = StatusCodes.BAD_GATEWAY;
    }
    res.end();

    this.logStatus(req, StatusCodes.BAD_GATEWAY, err);
  }

  private handleEnd(
    req: http.IncomingMessage,
    proxyRes: http.IncomingMessage
  ): void {
    this.logStatus(req, proxyRes.statusCode ?? 0);
  }
}

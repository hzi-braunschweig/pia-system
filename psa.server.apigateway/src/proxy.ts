/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import httpProxy from 'http-proxy';
import { HttpServer, ISsl } from './httpServer';
import { Header, Headers } from './headers';
import { Logging } from './logging';
import { Color } from './color';
import {
  isProxyRoute,
  isResponseRoute,
  ProxyRoute,
  ResponseRoute,
  Route,
} from './proxyRoute';
import { StatusCode } from './statusCode';

import * as http from 'http';

interface Context {
  received: number;
  route: ProxyRoute;
}

export class Proxy extends HttpServer<Context> {
  private static readonly BASE = 'http://localhost';
  private readonly proxy = httpProxy.createProxyServer();

  public constructor(
    private readonly routes: Route[],
    externalSsl?: ISsl,
    private readonly internalCa?: Buffer,
    private readonly disableLogging: boolean = false,
    private readonly headers?: Headers
  ) {
    super(externalSsl);

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
    const serviceName = context.route ? context.route.upstream.serviceName : '';
    console.log(
      `${Logging.colorizeStatus(statusCode)}: ${req.method ?? 'MISSING'} ${
        req.url ?? 'MISSING'
      } @ ${Color.serviceName(serviceName)} [${elapsed}] ${
        err ? Color.error(err.message) : ''
      }`
    );
  }

  protected handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    const route = this.routes.find((r) => req.url?.startsWith(r.path));
    if (isProxyRoute(route)) {
      this.handleProxyRoute(route, req, res);
    } else if (isResponseRoute(route) && req.url === route.path) {
      this.handleResponseRoute(route, req, res);
    } else {
      res.statusCode = StatusCode.NOT_FOUND;
      res.end();
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
      res.statusCode = 204;
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      Object.keys(route.response.headers).forEach((key) =>
        res.setHeader(key, route.response.headers[key]!)
      );
      res.write(route.response.body);
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
    url.pathname = route.upstream.path + url.pathname.substr(route.path.length);
    req.url = url.toString().substr(Proxy.BASE.length);

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
          protocol: route.upstream.protocol + ':',
          ca: this.internalCa ? this.internalCa.toString() : undefined,
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
    res: http.ServerResponse
  ): void {
    res.statusCode = StatusCode.BAD_GATEWAY;
    res.end();

    this.logStatus(req, StatusCode.BAD_GATEWAY, err);
  }

  private handleEnd(
    req: http.IncomingMessage,
    proxyRes: http.IncomingMessage
  ): void {
    this.logStatus(req, proxyRes.statusCode ?? 0);
  }
}

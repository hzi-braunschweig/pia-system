import httpProxy from 'http-proxy';
import { HttpServer, ISsl } from './httpServer';
import { parse as parseUrl, format as formatUrl } from 'url';
import { Headers, Header } from './headers';
import { Logging } from './logging';
import { Color } from './color';
import { ProxyRoute } from './proxyRoute';
import { StatusCode } from './statusCode';

import * as http from 'http';

interface Context {
  received: number;
  route: ProxyRoute;
}

export class Proxy extends HttpServer<Context> {
  private readonly proxy = httpProxy.createProxyServer();

  public constructor(
    private readonly routes: ProxyRoute[],
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
    const url = parseUrl(req.url ?? '');
    const pathname = url.pathname ?? '';
    const path = url.path ?? '';

    for (const route of this.routes) {
      if (pathname.startsWith(route.path)) {
        url.pathname = route.upstream.path + pathname.substr(route.path.length);
        url.path = route.upstream.path + path.substr(route.path.length);

        req.url = formatUrl(url);

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
        return;
      }
    }

    res.statusCode = StatusCode.NOT_FOUND;
    res.end();
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

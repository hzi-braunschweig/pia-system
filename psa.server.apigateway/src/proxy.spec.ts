/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { Proxy as HttpProxy } from './proxy';
import { Route } from './proxyRoute';
import { HttpServer } from './httpServer';
import { Headers } from './headers';
import { StatusCode } from './statusCode';
import { default as fetch, Response } from 'node-fetch';

import * as http from 'http';

class TestHttpServer extends HttpServer<unknown> {
  private statusCode: number | undefined;

  public setStatusCode(statusCode: number): void {
    this.statusCode = statusCode;
  }

  public getPort(): number {
    const address = this.getAddress();
    if (!address || typeof address === 'string') {
      return 0;
    }
    return address.port;
  }

  protected handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    if (this.statusCode !== undefined) {
      res.statusCode = this.statusCode;
    }
    res.write(
      JSON.stringify({
        url: decodeURIComponent(req.url ?? ''),
      })
    );
    res.end();
  }
}

class TestProxy extends HttpProxy {
  public getPort(): number {
    const address = this.getAddress();
    if (!address || typeof address === 'string') {
      return 0;
    }
    return address.port;
  }
}

class Helper {
  private static servers: HttpServer<unknown>[] = [];

  public static async expectUrl(
    proxy: TestProxy,
    requestUrl: string,
    expectedUrl: string
  ): Promise<Response> {
    const response = await fetch(
      `http://localhost:${proxy.getPort()}${requestUrl}`
    );
    expect(response.status).to.equal(StatusCode.OK);
    expect(await response.json()).to.deep.equal({
      url: expectedUrl,
    });
    return response;
  }

  public static async expectStatus(
    proxy: TestProxy,
    requestUrl: string,
    expectedStatus: number
  ): Promise<Response> {
    const response = await fetch(
      `http://localhost:${proxy.getPort()}${requestUrl}`
    );
    expect(response.status).to.equal(expectedStatus);
    return response;
  }

  public static async cleanup(): Promise<void> {
    for (const server of this.servers) {
      await server.close();
    }
    this.servers = [];
  }

  public static async startProxy(
    routes: Route[],
    loggingDisabled = true,
    headers?: Headers,
    ssl = false
  ): Promise<TestProxy> {
    const proxy = new TestProxy(
      routes,
      ssl
        ? {
            key: Buffer.alloc(0),
            cert: Buffer.alloc(0),
          }
        : undefined,
      undefined,
      loggingDisabled,
      headers
    );
    await proxy.listen();
    this.servers.push(proxy);
    return proxy;
  }

  public static async startHttpServer(): Promise<TestHttpServer> {
    const httpServer = new TestHttpServer();
    await httpServer.listen();
    this.servers.push(httpServer);
    return httpServer;
  }
}

describe('Proxy', () => {
  afterEach(async () => {
    await Helper.cleanup();
  });

  it('can be started and stopped', async () => {
    await Helper.startProxy([]);
  });

  it('gives 404 if no route is matched', async () => {
    const proxy = await Helper.startProxy([]);
    await Helper.expectStatus(proxy, '/', StatusCode.NOT_FOUND);
  });

  it('gives 502 on invalid upstream', async () => {
    const proxy = await Helper.startProxy([
      {
        path: '/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: 1,
          path: '/',
          protocol: 'http',
        },
      },
    ]);

    await Helper.expectStatus(proxy, '/test', StatusCode.BAD_GATEWAY);
  });

  it('can proxy a simple request', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/',
          protocol: 'http',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/', '/');
  });

  it('can rewrite routes correctly', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
      {
        path: '/api/v1/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
      {
        path: '/admin/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/test/a', '/test/a');
    await Helper.expectUrl(proxy, '/admin/test/a', '/test/a');
    await Helper.expectUrl(proxy, '/api/v1/test/a', '/test/a');
  });

  it('can rewrite routes with special characters correctly', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
      {
        path: '/api/v1/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
      {
        path: '/admin/test/',
        upstream: {
          host: 'localhost',
          serviceName: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
          protocol: 'http',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/test/a b c de', '/test/a b c de');
    await Helper.expectUrl(proxy, '/admin/test/a b c de', '/test/a b c de');
    await Helper.expectUrl(proxy, '/api/v1/test/a b c de', '/test/a b c de');
  });

  it('works with logging enabled', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/test/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/test/',
            protocol: 'http',
          },
        },
      ],
      false
    );

    await Helper.expectUrl(proxy, '/test/a b c de', '/test/a b c de');
  });

  it('passes 404', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCode.NOT_FOUND);
    await Helper.expectStatus(proxy, '/test', StatusCode.NOT_FOUND);
  });

  it('passes 301', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCode.MOVED_PERMANENTLY);
    await Helper.expectStatus(proxy, '/test', StatusCode.MOVED_PERMANENTLY);
  });

  it('passes 502', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCode.BAD_GATEWAY);
    await Helper.expectStatus(proxy, '/test', StatusCode.BAD_GATEWAY);
  });

  it('adds headers', async () => {
    const xFrameOptions = 'test-xFrameOptions';
    const contentSecurityPolicy = 'test-contentSecurityPolicy';
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false,
      {
        xFrameOptions,
        contentSecurityPolicy,
      }
    );

    const response = await Helper.expectUrl(proxy, '/test', '/test');
    expect(response.headers.get('x-frame-options')).to.equal(xFrameOptions);
    expect(response.headers.get('content-security-policy')).to.equal(
      contentSecurityPolicy
    );
  });

  it('works with empty headers', async () => {
    const xFrameOptions = '';
    const contentSecurityPolicy = '';
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false,
      {
        xFrameOptions,
        contentSecurityPolicy,
      }
    );

    const response = await Helper.expectUrl(proxy, '/test', '/test');
    expect(response.headers.has('x-frame-options')).to.equal(false);
    expect(response.headers.has('content-security-policy')).to.equal(false);
  });

  it('crashes on https without key/cert', async () => {
    const dummy = await Helper.startHttpServer();
    const result = Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            serviceName: 'localhost',
            port: dummy.getPort(),
            path: '/',
            protocol: 'http',
          },
        },
      ],
      false,
      undefined,
      true
    ).then(
      async () => Promise.resolve(false),
      async () => Promise.resolve(true)
    );

    expect(await result).to.equal(true);
  });

  it('should return a predefined response', async () => {
    const proxy = await Helper.startProxy(
      [
        {
          path: '/api/test',
          response: {
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({ test: 'value' }),
          },
        },
      ],
      false
    );
    const response = await fetch(
      `http://localhost:${proxy.getPort()}/api/test`
    );
    expect(response.status).to.equal(StatusCode.OK);
    expect(await response.text()).to.equal('{"test":"value"}');
  });
});

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import * as http from 'http';
import { StatusCodes } from 'http-status-codes';
import { default as fetch, Response } from 'node-fetch';

import { Proxy as HttpProxy } from './proxy';
import { HttpServer } from './httpServer';
import { Headers } from './headers';
import { ProxyRouteConfig } from './proxyRoute';
import { ResponseRouteConfig } from './responseRoute';

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
    expect(response.status).to.equal(StatusCodes.OK);
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
    routes: (ProxyRouteConfig | ResponseRouteConfig)[],
    loggingDisabled = true,
    headers?: Headers
  ): Promise<TestProxy> {
    const proxy = new TestProxy(routes, loggingDisabled, headers);
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
    await Helper.expectStatus(proxy, '/', StatusCodes.NOT_FOUND);
  });

  it('gives 502 on invalid upstream', async () => {
    const proxy = await Helper.startProxy([
      {
        path: '/',
        upstream: {
          host: 'localhost',
          port: 1,
          path: '/',
        },
      },
    ]);

    await Helper.expectStatus(proxy, '/test', StatusCodes.BAD_GATEWAY);
  });

  it('can proxy a simple request', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/',
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
          port: dummy.getPort(),
          path: '/test/',
        },
      },
      {
        path: '/api/v1/test/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
      {
        path: '/admin/test/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
      {
        path: '/public/dynamic/:segment',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/dynamic/:segment/',
        },
      },
      {
        path: '/public/api/v1/dynamic/:segment2/and/:another/:segment1',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/public/dynamic/:segment1/and/:another/:segment2',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/test/a', '/test/a');
    await Helper.expectUrl(proxy, '/admin/test/a', '/test/a');
    await Helper.expectUrl(proxy, '/api/v1/test/a', '/test/a');
    await Helper.expectUrl(proxy, '/public/dynamic/1', '/dynamic/1/');
    await Helper.expectUrl(proxy, '/public/dynamic/123', '/dynamic/123/');
    await Helper.expectUrl(proxy, '/public/dynamic/5678', '/dynamic/5678/');
    await Helper.expectUrl(
      proxy,
      '/public/dynamic/123/additional/segments',
      '/dynamic/123/additional/segments'
    );
    await Helper.expectUrl(
      proxy,
      '/public/api/v1/dynamic/segment2/and/another/segment1',
      '/public/dynamic/segment1/and/another/segment2'
    );
    await Helper.expectUrl(
      proxy,
      '/public/api/v1/dynamic/segment2/and/another/segment1/with/even/more',
      '/public/dynamic/segment1/and/another/segment2/with/even/more'
    );
  });

  it('can rewrite routes with special characters correctly', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/test/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
      {
        path: '/api/v1/test/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
      {
        path: '/admin/test/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/test/a b c de', '/test/a b c de');
    await Helper.expectUrl(proxy, '/admin/test/a b c de', '/test/a b c de');
    await Helper.expectUrl(proxy, '/api/v1/test/a b c de', '/test/a b c de');
  });

  it('can handle query params', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/test',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
    ]);

    await Helper.expectUrl(
      proxy,
      '/test/some/path?param=1',
      '/test/some/path?param=1'
    );
    await Helper.expectUrl(
      proxy,
      '/test/some/path?param=test&anotherparam=1234',
      '/test/some/path?param=test&anotherparam=1234'
    );
  });

  it('ignores url fragments', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/test',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/test/',
        },
      },
    ]);

    await Helper.expectUrl(
      proxy,
      '/test/some/path#irrelevant-hash',
      '/test/some/path'
    );
  });

  it('works with logging enabled', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/test/',
          upstream: {
            host: 'localhost',
            port: dummy.getPort(),
            path: '/test/',
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
            port: dummy.getPort(),
            path: '/',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCodes.NOT_FOUND);
    await Helper.expectStatus(proxy, '/test', StatusCodes.NOT_FOUND);
  });

  it('passes 301', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            port: dummy.getPort(),
            path: '/',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCodes.MOVED_PERMANENTLY);
    await Helper.expectStatus(proxy, '/test', StatusCodes.MOVED_PERMANENTLY);
  });

  it('passes 502', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy(
      [
        {
          path: '/',
          upstream: {
            host: 'localhost',
            port: dummy.getPort(),
            path: '/',
          },
        },
      ],
      false
    );

    dummy.setStatusCode(StatusCodes.BAD_GATEWAY);
    await Helper.expectStatus(proxy, '/test', StatusCodes.BAD_GATEWAY);
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
            port: dummy.getPort(),
            path: '/',
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
            port: dummy.getPort(),
            path: '/',
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
    expect(response.status).to.equal(StatusCodes.OK);
    expect(await response.text()).to.equal('{"test":"value"}');
  });

  it('can add a route with a predefined status code response', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/special/route',
        response: {
          statusCode: StatusCodes.NOT_FOUND,
        },
      },
      {
        path: '/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/',
        },
      },
    ]);

    await Helper.expectUrl(proxy, '/', '/');

    const response = await fetch(
      `http://localhost:${proxy.getPort()}/special/route`
    );
    expect(response.status).to.equal(StatusCodes.NOT_FOUND);
  });

  it('can answer to an OPTIONS request', async () => {
    const proxy = await Helper.startProxy([
      {
        path: '/',
        response: {
          body: '{}',
        },
      },
    ]);

    const response = await fetch(`http://localhost:${proxy.getPort()}/`, {
      method: 'OPTIONS',
    });
    expect(response.status).to.equal(StatusCodes.NO_CONTENT);
  });

  it('can handle a bad request url to proxy gracefully', async () => {
    const dummy = await Helper.startHttpServer();
    const proxy = await Helper.startProxy([
      {
        path: '/',
        upstream: {
          host: 'localhost',
          port: dummy.getPort(),
          path: '/',
        },
      },
    ]);

    const response = await fetch(`http://localhost:${proxy.getPort()}//`);
    expect(response.status).to.equal(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

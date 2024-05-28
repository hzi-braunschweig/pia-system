/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as http from 'http';
import * as net from 'net';

export interface ISsl {
  cert: Buffer;
  key: Buffer;
}

export abstract class HttpServer<T> {
  private readonly httpServer: http.Server;

  public constructor() {
    this.httpServer = http.createServer<
      typeof http.IncomingMessage,
      typeof http.ServerResponse
    >((req, res) => {
      this.handleRequest(req, res);
    });
  }

  public getAddress(): string | net.AddressInfo | null {
    return this.httpServer.address();
  }

  public async listen(port?: number): Promise<void> {
    return new Promise<void>((resolve) => {
      this.httpServer.listen(port, resolve);
    });
  }

  public async close(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.httpServer.close(() => {
        resolve();
      });
    });
  }

  protected getContext(req: http.IncomingMessage): Partial<T> {
    // eslint-disable-next-line
    let context = (req as any)._privateContext;
    if (!context) {
      context = {};
      // eslint-disable-next-line
      (req as any)._privateContext = context;
    }
    return context as Partial<T>;
  }

  protected abstract handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void;
}

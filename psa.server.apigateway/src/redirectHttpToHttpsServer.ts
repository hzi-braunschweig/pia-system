/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpServer } from './httpServer';
import { StatusCodes } from 'http-status-codes';

import * as http from 'http';

export class RedirectHttpToHttpsServer extends HttpServer<unknown> {
  protected handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    res.writeHead(StatusCodes.MOVED_PERMANENTLY, {
      Location: `https://${req.headers.host ?? ''}${req.url ?? ''}`,
    });
    res.end();
  }
}

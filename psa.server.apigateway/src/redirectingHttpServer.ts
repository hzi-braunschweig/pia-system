import { HttpServer } from './httpServer';
import { StatusCode } from './statusCode';

import * as http from 'http';

export class RedirectingHttpServer extends HttpServer<unknown> {
  protected handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    res.writeHead(StatusCode.MOVED_PERMANENTLY, {
      Location: `https://${req.headers.host ?? ''}${req.url ?? ''}`,
    });
    res.end();
  }
}

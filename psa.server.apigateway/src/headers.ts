import * as http from 'http';

export interface Headers {
  xFrameOptions: string;
  contentSecurityPolicy: string;
}

export class Header {
  public static addHeaders(res: http.ServerResponse, headers: Headers): void {
    if (headers.xFrameOptions !== '') {
      res.setHeader('X-Frame-Options', headers.xFrameOptions);
    }
    if (headers.contentSecurityPolicy !== '') {
      res.setHeader('Content-Security-Policy', headers.contentSecurityPolicy);
    }
  }
}

export interface Upstream {
  host: string;
  serviceName: string;
  port: number;
  path: string;
  protocol: 'http' | 'https';
}

export interface ProxyRoute {
  path: string;
  upstream: Upstream;
}

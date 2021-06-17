export interface Connection {
  host: string;
  port: number;
}

export interface SecureConnection extends Connection {
  tls: false | TlsSettings;
}

export type HttpProtocol = 'http' | 'https';

export class HttpConnection implements Connection {
  public constructor(
    public protocol: HttpProtocol,
    public host: string,
    public port: number
  ) {}

  public get url(): string {
    return `${this.protocol}://${this.host}:${this.port}`;
  }
}

export interface DatabaseConnection extends Connection {
  user: string;
  password: string;
  database: string;
  ssl: SslSettings;
}

export interface MailserverConnection extends Connection {
  user: string;
  password: string;
  requireTLS: boolean;
  from: string;
  name: string;
}

export interface SftpServerConnection extends Connection {
  username: string;
  password: string;
}

export interface TlsSettings {
  cert: Buffer;
  key: Buffer;
  rejectUnauthorized: true;
}

export interface SslCerts {
  cert: Buffer;
  key: Buffer;
  ca: Buffer;
}

export interface SslSettings extends SslCerts {
  rejectUnauthorized: boolean;
}

/**
 * Global schema of service configuration
 */
export interface ServiceConfig {
  public: SecureConnection;
  internal?: Connection;
  database?: DatabaseConnection;
  services?: {
    authservice?: HttpConnection;
    complianceservice?: HttpConnection;
    loggingservice?: HttpConnection;
    personaldataservice?: HttpConnection;
    sormasservice?: HttpConnection;
    userservice?: HttpConnection;
  };
  servers?: {
    mailserver?: MailserverConnection;
    mhhftpserver?: SftpServerConnection;
    hzistpserver?: SftpServerConnection;
  };
  publicAuthKey?: Buffer;
  webappUrl?: string;
  backendApiUrl?: string;
  /**
   * @deprecated use the messagequeue to communicate with sormasservice
   */
  isSormasActive?: boolean;
}

/**
 * Checks whether all properties existing in C and ServiceConfig meet the types of ServiceConfig.
 * Allows additional config properties. All properties of C are required.
 *
 * Whenever this results in a "Type ... is not assignable to type 'never'" error,
 * you can temporarily assign ServiceConfig as type to your actual configuration object
 * in order get specific type errors.
 */
export type SupersetOfServiceConfig<C> = Required<Extract<C, ServiceConfig>>;

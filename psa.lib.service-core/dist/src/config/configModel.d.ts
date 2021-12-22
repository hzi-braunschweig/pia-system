/// <reference types="node" />
export interface Connection {
    host: string;
    port: number;
}
export interface SecureConnection extends Connection {
    tls: false | TlsSettings;
}
export declare type HttpProtocol = 'http' | 'https';
export declare class HttpConnection implements Connection {
    protocol: HttpProtocol;
    host: string;
    port: number;
    constructor(protocol: HttpProtocol, host: string, port: number);
    get url(): string;
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
export interface MessageQueueConnection extends Connection {
    username: string;
    password: string;
    serviceName: string;
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
        messageQueue?: MessageQueueConnection;
    };
    publicAuthKey?: Buffer;
    webappUrl?: string;
    backendApiUrl?: string;
}
export declare type SupersetOfServiceConfig<C> = Required<Extract<C, ServiceConfig>>;

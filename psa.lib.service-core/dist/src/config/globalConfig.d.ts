/// <reference types="node" />
import { Connection, DatabaseConnection, HttpConnection, MailserverConnection, SecureConnection, SslCerts } from './configModel';
export declare class GlobalConfig {
    static get internal(): Connection;
    static get authservice(): HttpConnection;
    static get complianceservice(): HttpConnection;
    static get loggingservice(): HttpConnection;
    static get personaldataservice(): HttpConnection;
    static get userservice(): HttpConnection;
    static get sormasservice(): HttpConnection;
    static get mailserver(): MailserverConnection;
    static get isSormasActive(): boolean;
    static get webappUrl(): string;
    static get backendApiUrl(): string;
    static get publicAuthKey(): Buffer;
    static getPublic(sslCerts: SslCerts): SecureConnection;
    static getQPia(sslCerts: SslCerts): DatabaseConnection;
    private static getHttpConnection;
}

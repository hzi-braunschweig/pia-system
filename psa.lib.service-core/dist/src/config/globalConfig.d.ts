import { AuthClientSettings, AuthSettings, Connection, DatabaseConnection, HttpConnection, MailserverConnection, MessageQueueConnection, SecureConnection, SslCerts } from './configModel';
export declare class GlobalAuthSettings implements AuthSettings {
    static get keycloakHttpConnection(): HttpConnection;
    static get probandTokenIntrospectionClient(): AuthClientSettings;
    static get probandManagementClient(): AuthClientSettings;
    static get adminTokenIntrospectionClient(): AuthClientSettings;
    static get adminManagementClient(): AuthClientSettings;
}
export declare class GlobalConfig {
    static authserver: typeof GlobalAuthSettings;
    static get complianceservice(): HttpConnection;
    static get loggingservice(): HttpConnection;
    static get personaldataservice(): HttpConnection;
    static get questionnaireservice(): HttpConnection;
    static get userservice(): HttpConnection;
    static get timeZone(): string;
    static get mailserver(): MailserverConnection;
    static get probandAppUrl(): string;
    static get adminAppUrl(): string;
    static getInternal(serviceName: string): Connection;
    static getPublic(sslCerts: SslCerts, serviceName: string): SecureConnection;
    static getQPia(sslCerts: SslCerts): DatabaseConnection;
    static getMessageQueue(serviceName: string): MessageQueueConnection;
    static isDevelopmentSystem(): boolean;
    static isTest(): boolean;
    private static getHttpConnection;
    private static getPort;
}

export interface Connection {
    host: string;
    port: number;
}
export declare class HttpConnection implements Connection {
    host: string;
    port: number;
    constructor(host: string, port: number);
    get url(): string;
}
export interface DatabaseConnection extends Connection {
    user: string;
    password: string;
    database: string;
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
export interface AuthSettings {
    probandTokenIntrospectionClient?: AuthClientSettings;
    probandManagementClient?: AuthClientSettings;
    adminTokenIntrospectionClient?: AuthClientSettings;
    adminManagementClient?: AuthClientSettings;
    messageQueueExchange?: string;
}
export interface AuthClientSettings {
    connection: HttpConnection;
    realm: string;
    clientId: string;
    secret: string;
}
export interface ServiceConfig {
    public: Connection;
    internal?: Connection;
    database?: DatabaseConnection;
    services?: {
        complianceservice?: HttpConnection;
        loggingservice?: HttpConnection;
        personaldataservice?: HttpConnection;
        userservice?: HttpConnection;
        questionnaireservice?: HttpConnection;
    };
    servers?: {
        mailserver?: MailserverConnection;
        mhhftpserver?: SftpServerConnection;
        hziftpserver?: SftpServerConnection;
        messageQueue?: MessageQueueConnection;
        authserver?: AuthSettings;
    };
    probandAppUrl?: string;
    adminAppUrl?: string;
    backendApiUrl?: string;
}
export declare type SupersetOfServiceConfig<C> = Required<Extract<C, ServiceConfig>>;

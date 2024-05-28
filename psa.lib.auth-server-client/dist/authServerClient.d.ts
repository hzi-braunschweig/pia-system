/// <reference types="node" />
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { EventEmitter } from 'events';
export interface AuthServerClientSettings {
    connection: {
        url: string;
    };
    realm: string;
    clientId: string;
    secret: string;
}
export declare class AuthServerClient extends KcAdminClient {
    private readonly clientSettings;
    private readonly reconnectInterval;
    readonly connectionEvents: EventEmitter;
    readonly realm: string;
    private waitForConnection;
    private currentInterval;
    private connected;
    private accessTokenLifespan;
    constructor(clientSettings: AuthServerClientSettings, reconnectInterval?: number);
    isConnected(): boolean;
    connect(): void;
    disconnect(): void;
    waitForServer(): Promise<void>;
    private authenticate;
    private resetInterval;
    private initConnectionHandling;
    private reconnect;
    private initRenewTokenHandling;
    private waitForRealm;
}

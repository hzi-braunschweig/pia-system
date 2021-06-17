/// <reference types="node" />
import { Server } from '@hapi/hapi';
import { IDatabase } from 'pg-promise';
export declare type AuthStrategy = 'jwt' | 'jwt_login' | 'simple';
export interface AuthStrategyOptions {
    strategies: AuthStrategy[];
    publicAuthKey?: Buffer;
    db?: IDatabase<unknown>;
    basicCredentials?: {
        username: string;
        password: string;
    };
}
export declare const registerAuthStrategies: (server: Server, options: AuthStrategyOptions) => Promise<void>;

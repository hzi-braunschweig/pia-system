/// <reference types="node" />
import { Server } from '@hapi/hapi';
import { IDatabase } from 'pg-promise';
export declare type AuthStrategy = 'jwt' | 'jwt_login';
export interface AuthStrategyOptions {
    strategies: AuthStrategy[];
    publicAuthKey?: Buffer;
    db?: IDatabase<unknown>;
}
export declare const registerAuthStrategies: (server: Server, options: AuthStrategyOptions) => Promise<void>;

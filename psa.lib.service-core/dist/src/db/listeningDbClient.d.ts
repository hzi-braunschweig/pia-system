/// <reference types="node" />
import EventEmitter from 'events';
import { IDatabase } from 'pg-promise';
import * as pg from 'pg-promise/typescript/pg-subset';
export declare class ListeningDbClient<Ext, C extends pg.IClient = pg.IClient> extends EventEmitter {
    private readonly db;
    private sco;
    private disconnected;
    private readonly TIME_TO_WAIT_BEFORE_RETRY;
    constructor(db: IDatabase<Ext, C>);
    private static onError;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private onConnectionLost;
}

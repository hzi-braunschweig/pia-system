import { IBaseProtocol, IDatabase, ITask } from 'pg-promise';
export interface RepositoryOptions {
    transaction?: ITask<unknown>;
}
export interface DbConnectionGetterFn {
    (options?: RepositoryOptions | null): IBaseProtocol<unknown>;
}
export declare class RepositoryHelper {
    static createDbConnectionGetter(db: IDatabase<unknown>): DbConnectionGetterFn;
}

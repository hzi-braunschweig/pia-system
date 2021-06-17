import { IDatabase, ITask } from 'pg-promise';
export interface TransactionRunnerFn {
    <T>(callback: TransactionCallback): Promise<T>;
}
export interface TransactionCallback {
    <T>(transaction: ITask<unknown>): Promise<T>;
}
export declare function createTransactionRunner(db: IDatabase<unknown>): TransactionRunnerFn;

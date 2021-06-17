import pgPromise from 'pg-promise';
import { LoginToken, TokenValidationFn } from '../authModel';
export declare function validateLoginToken(db?: pgPromise.IDatabase<unknown>): TokenValidationFn<LoginToken>;

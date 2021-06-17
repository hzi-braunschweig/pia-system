import pgPromise from 'pg-promise';
import { AccessToken, TokenValidationFn } from '../authModel';
export declare function validateAccessToken(db?: pgPromise.IDatabase<unknown>): TokenValidationFn<AccessToken>;

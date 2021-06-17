import { Request } from '@hapi/hapi';
export interface BasicValidationFn {
    (request: Request, username: string, password: string): ValidationResult;
}
export interface TokenValidationFn<T extends AuthToken> {
    (decoded: T): Promise<ValidationResult>;
}
export interface ValidationResult {
    isValid: boolean;
    credentials?: {
        name: string;
    };
}
declare type AccessTokenId = 1;
declare type LoginTokenId = 2;
export interface AccessToken extends AuthToken {
    id: AccessTokenId;
    role: string;
    groups: string[];
}
export interface LoginToken extends AuthToken {
    id: LoginTokenId;
}
export interface AuthToken {
    id: AccessTokenId | LoginTokenId;
    username: string;
}
export declare const ACCESS_TOKEN_ID = 1;
export declare const LOGIN_TOKEN_ID = 2;
export declare function isAccessToken(token: AuthToken): token is AccessToken;
export declare function isLoginToken(token: AuthToken): token is LoginToken;
export {};

import { RealmRole } from '../auth/realmRole';
export interface TokenAttributes {
    username: string;
    roles: RealmRole[];
    studies: string[];
}
export interface AuthHeader {
    authorization: string;
}
export declare class AuthTokenMockBuilder {
    static createAuthHeader(tokenAttributes: TokenAttributes): AuthHeader;
    static createToken(tokenAttributes: TokenAttributes): string;
    private static createTokenPayload;
    private static buildToken;
    private static toBase64;
    private static assertLowerCase;
}

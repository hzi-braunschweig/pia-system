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
    static createTokenPayload({ username, roles, studies, }: TokenAttributes): Record<string, unknown>;
    private static buildToken;
    private static toBase64;
    private static assertLowerCase;
}

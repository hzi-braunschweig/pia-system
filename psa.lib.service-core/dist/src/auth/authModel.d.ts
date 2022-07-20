import { AuthCredentials } from '@hapi/hapi';
export interface AccessToken extends AuthCredentials {
    username: string;
    studies: string[];
    locale: string;
}
export declare function isAccessToken(token: Record<string, unknown>): token is AccessToken;

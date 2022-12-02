import { AuthCredentials, MergeType } from '@hapi/hapi';
export interface AccessToken extends MergeType<Record<string, unknown>, AuthCredentials> {
    username: string;
    studies: string[];
    locale: string;
}
export declare function isAccessToken(token: Record<string, unknown>): token is AccessToken;

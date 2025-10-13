import { AuthCredentials, MergeType } from '@hapi/hapi';
export interface CredentialsExtra {
    username: string;
    studies: string[];
    locale: string;
}
export declare type RequestAuthCredentials = MergeType<CredentialsExtra, AuthCredentials>;
export declare type AccessToken = Record<string, unknown> & MergeType<CredentialsExtra, AuthCredentials>;

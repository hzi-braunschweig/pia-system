import Hapi from '@hapi/hapi';
import { AuthClientSettings } from '../config/configModel';
import { TsoaAuthenticator } from './tsoaAuthenticator';
import { AccessToken } from './authModel';
export declare const publicApiSecurity = "jwt-public";
export declare class PublicApiAuthenticator extends TsoaAuthenticator {
    private static readonly publicApiSecurityName;
    static authenticate(securityName: string, request: Hapi.Request, authClientSettings: AuthClientSettings): Promise<AccessToken>;
}

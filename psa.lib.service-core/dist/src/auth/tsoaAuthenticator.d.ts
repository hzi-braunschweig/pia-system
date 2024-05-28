import Hapi from '@hapi/hapi';
import { AuthClientSettings } from '../config/configModel';
import { AccessToken } from './authModel';
export declare abstract class TsoaAuthenticator {
    private readonly securityName;
    private readonly authClientSettings;
    protected constructor(securityName: string, authClientSettings: AuthClientSettings);
    authenticate(securityNameOfPath: string, request: Hapi.Request): Promise<AccessToken>;
    private verifyToken;
    private isTokenValid;
    private assertStudyAccess;
}

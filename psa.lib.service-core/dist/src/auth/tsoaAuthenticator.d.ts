import Hapi from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { AuthClientSettings } from '../config/configModel';
import { SpecificError } from '../plugins/errorHandler';
import { AccessToken } from './authModel';
export declare class InvalidAuthorizationTokenError extends SpecificError {
    readonly statusCode = StatusCodes.UNAUTHORIZED;
    readonly errorCode = "INVALID_AUTHORIZATION_TOKEN";
    readonly message = "No or invalid authorization token provided";
}
export declare abstract class TsoaAuthenticator {
    private readonly securityName;
    private readonly authClientSettings;
    protected constructor(securityName: string, authClientSettings: AuthClientSettings);
    authenticate(securityNameOfPath: string, request: Hapi.Request): Promise<AccessToken>;
    private verifyToken;
    private isTokenValid;
    private assertStudyAccess;
}

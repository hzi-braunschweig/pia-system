import { AccessToken } from './authModel';
import { SpecificError } from '../plugins/errorHandler';
import { StatusCodes } from 'http-status-codes';
export declare class MissingStudyAccessError extends SpecificError {
    readonly statusCode = StatusCodes.FORBIDDEN;
    readonly errorCode = "MISSING_STUDY_ACCESS";
}
export declare function assertStudyAccess(expectedStudyName: string, decodedToken: AccessToken): void;

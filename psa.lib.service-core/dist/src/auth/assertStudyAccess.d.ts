import { AuthCredentials } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { SpecificError } from '../plugins/errorHandler';
export declare class MissingStudyAccessError extends SpecificError {
    readonly statusCode = StatusCodes.FORBIDDEN;
    readonly errorCode = "MISSING_STUDY_ACCESS";
}
export declare function assertStudyAccess(expectedStudyName: string, credentials: Record<string, unknown> & AuthCredentials): void;

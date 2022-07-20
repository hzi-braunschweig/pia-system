import { AccessToken } from './authModel';
import { SpecificError } from '../plugins/errorHandler';
import { StatusCodes } from 'http-status-codes';
export declare class ProbandStudyError extends SpecificError {
    readonly statusCode = StatusCodes.BAD_REQUEST;
    readonly errorCode = "PROBAND_STUDY_ERROR";
}
export declare function getProbandStudy(decodedToken: AccessToken): string;

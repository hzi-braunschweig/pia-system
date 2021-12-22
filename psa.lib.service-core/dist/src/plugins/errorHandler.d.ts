import { Plugin } from '@hapi/hapi';
export declare abstract class ErrorWithCausedBy extends Error {
    readonly causedBy?: unknown;
    constructor(message?: string, causedBy?: unknown);
}
export declare abstract class SpecificError extends ErrorWithCausedBy {
    abstract readonly statusCode: number;
    abstract readonly errorCode: string;
}
export declare const ErrorHandler: Plugin<unknown>;

import { AuthCredentials } from '@hapi/hapi';
import { StatusCodes } from 'http-status-codes';
import { SpecificError } from '../plugins/errorHandler';
export declare type ProbandRealmRole = 'Proband';
export declare type AdminRealmRole = 'Forscher' | 'ProbandenManager' | 'EinwilligungsManager' | 'Untersuchungsteam' | 'SysAdmin';
export declare type RealmRole = AdminRealmRole | ProbandRealmRole;
export declare class MissingPermissionError extends SpecificError {
    readonly statusCode = StatusCodes.FORBIDDEN;
    readonly errorCode = "MISSING_PERMISSION";
}
export declare function getRealmRoles(authCredentials: AuthCredentials): RealmRole[];
export declare function getPrimaryRealmRole(authCredentials: AuthCredentials): RealmRole;
export declare function hasRealmRole(expectedRole: RealmRole, authCredentials: AuthCredentials): boolean;

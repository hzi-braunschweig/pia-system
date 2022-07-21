"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRealmRole = exports.getPrimaryRealmRole = exports.getRealmRoles = exports.MissingPermissionError = void 0;
const http_status_codes_1 = require("http-status-codes");
const errorHandler_1 = require("../plugins/errorHandler");
const realmRolePrefix = 'realm:';
const realmRoleSpecializationSeparatorChar = '-';
class MissingPermissionError extends errorHandler_1.SpecificError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.FORBIDDEN;
        this.errorCode = 'MISSING_PERMISSION';
    }
}
exports.MissingPermissionError = MissingPermissionError;
function getRealmRoles(authCredentials) {
    if (!Array.isArray(authCredentials.scope)) {
        throw new MissingPermissionError('Missing permission error: auth credentials scope is undefined');
    }
    return authCredentials.scope
        .filter((scope) => scope.startsWith(realmRolePrefix))
        .map((scope) => scope.slice(realmRolePrefix.length));
}
exports.getRealmRoles = getRealmRoles;
function getPrimaryRealmRole(authCredentials) {
    const primaryRole = getRealmRoles(authCredentials).find((role) => !role.includes(realmRoleSpecializationSeparatorChar));
    if (!primaryRole) {
        throw new MissingPermissionError('Missing permission error: user has no primary role');
    }
    return primaryRole;
}
exports.getPrimaryRealmRole = getPrimaryRealmRole;
function hasRealmRole(expectedRole, authCredentials) {
    return getRealmRoles(authCredentials).includes(expectedRole);
}
exports.hasRealmRole = hasRealmRole;
//# sourceMappingURL=realmRole.js.map
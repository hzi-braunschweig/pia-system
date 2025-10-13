"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertStudyAccess = exports.MissingStudyAccessError = void 0;
const http_status_codes_1 = require("http-status-codes");
const errorHandler_1 = require("../plugins/errorHandler");
const realmRole_1 = require("./realmRole");
class MissingStudyAccessError extends errorHandler_1.SpecificError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.FORBIDDEN;
        this.errorCode = 'MISSING_STUDY_ACCESS';
    }
}
exports.MissingStudyAccessError = MissingStudyAccessError;
function assertStudyAccess(expectedStudyName, credentials) {
    if ((0, realmRole_1.hasRealmRole)('SysAdmin', credentials)) {
        return;
    }
    if (hasStudiesAttribute(credentials) &&
        credentials.studies.includes(expectedStudyName)) {
        return;
    }
    throw new MissingStudyAccessError(`Requesting user has no access to study "${expectedStudyName}"`);
}
exports.assertStudyAccess = assertStudyAccess;
function hasStudiesAttribute(decodedToken) {
    return ('studies' in decodedToken &&
        Array.isArray(decodedToken['studies']) &&
        decodedToken['studies'].every((x) => typeof x === 'string'));
}
//# sourceMappingURL=assertStudyAccess.js.map
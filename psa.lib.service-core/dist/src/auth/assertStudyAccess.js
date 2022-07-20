"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertStudyAccess = exports.MissingStudyAccessError = void 0;
const errorHandler_1 = require("../plugins/errorHandler");
const http_status_codes_1 = require("http-status-codes");
const realmRole_1 = require("./realmRole");
class MissingStudyAccessError extends errorHandler_1.SpecificError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.FORBIDDEN;
        this.errorCode = 'MISSING_STUDY_ACCESS';
    }
}
exports.MissingStudyAccessError = MissingStudyAccessError;
function assertStudyAccess(expectedStudyName, decodedToken) {
    if (!(0, realmRole_1.hasRealmRole)('SysAdmin', decodedToken) &&
        !decodedToken.studies.includes(expectedStudyName)) {
        throw new MissingStudyAccessError(`Requesting user has no access to study "${expectedStudyName}"`);
    }
}
exports.assertStudyAccess = assertStudyAccess;
//# sourceMappingURL=assertStudyAccess.js.map
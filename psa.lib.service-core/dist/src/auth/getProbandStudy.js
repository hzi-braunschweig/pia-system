"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProbandStudy = exports.ProbandStudyError = void 0;
const errorHandler_1 = require("../plugins/errorHandler");
const http_status_codes_1 = require("http-status-codes");
class ProbandStudyError extends errorHandler_1.SpecificError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST;
        this.errorCode = 'PROBAND_STUDY_ERROR';
    }
}
exports.ProbandStudyError = ProbandStudyError;
function getProbandStudy(decodedToken) {
    if (decodedToken.studies.length !== 1 || !decodedToken.studies[0]) {
        throw new ProbandStudyError();
    }
    return decodedToken.studies[0];
}
exports.getProbandStudy = getProbandStudy;
//# sourceMappingURL=getProbandStudy.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.SpecificError = exports.ErrorWithCausedBy = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const boom_1 = __importDefault(require("@hapi/boom"));
const typeGuards_1 = require("../utils/typeGuards");
class ErrorWithCausedBy extends Error {
    constructor(message, causedBy) {
        super(message);
        this.causedBy = causedBy;
    }
}
exports.ErrorWithCausedBy = ErrorWithCausedBy;
class SpecificError extends ErrorWithCausedBy {
}
exports.SpecificError = SpecificError;
const INDENTATION = 2;
exports.ErrorHandler = {
    name: 'error-handler',
    version: '1.0.0',
    register: function (server) {
        server.ext('onPreResponse', (r, h) => {
            if (r.response instanceof Error) {
                if (r.response instanceof SpecificError) {
                    boom_1.default.boomify(r.response, {
                        statusCode: r.response.statusCode,
                    });
                    r.response.output.payload['errorCode'] = r.response.errorCode;
                    r.log('info', `${r.response.output.statusCode} [${r.response.errorCode}] - ${r.response.message}` +
                        createCausedByLog(r.response));
                }
                else if (r.response.output.statusCode >= http_status_codes_1.default.INTERNAL_SERVER_ERROR) {
                    r.log('error', `${r.response.output.statusCode} - ${r.response.stack ?? ''}` +
                        createCausedByLog(r.response, true) +
                        ' ' +
                        JSON.stringify(r.response, null, INDENTATION));
                }
                else {
                    r.log('warn', `${r.response.output.statusCode} - ${r.response.message}` +
                        createCausedByLog(r.response));
                }
            }
            return h.continue;
        });
    },
};
function createCausedByLog(err, withStack = false) {
    if ((0, typeGuards_1.hasNonNullishProperty)(err, 'causedBy')) {
        if (err.causedBy instanceof Error) {
            return ('\nCaused By: ' +
                (withStack ? err.causedBy.stack ?? '' : err.causedBy.message) +
                createCausedByLog(err.causedBy, withStack));
        }
        else {
            return '\nCaused By: ' + String(err.causedBy);
        }
    }
    else {
        return '';
    }
}
//# sourceMappingURL=errorHandler.js.map
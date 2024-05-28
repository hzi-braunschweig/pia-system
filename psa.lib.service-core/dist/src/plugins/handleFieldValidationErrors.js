"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleFieldValidationErrors = void 0;
const boom_1 = require("@hapi/boom");
const http_status_codes_1 = require("http-status-codes");
exports.HandleFieldValidationErrors = {
    name: 'field-validation-error',
    version: '1.0.0',
    register: function (server) {
        server.ext('onPreResponse', (request, h) => {
            if (request.response instanceof boom_1.Boom &&
                isValidateError(request.response)) {
                request.response = asBoom(request.response.fields);
            }
            return h.continue;
        });
    },
};
function asBoom(fields) {
    return new boom_1.Boom(getMessage(fields), {
        statusCode: http_status_codes_1.StatusCodes.UNPROCESSABLE_ENTITY,
        data: fields,
    });
}
function getMessage(fields) {
    return ('Payload is invalid:\n' +
        Object.entries(fields)
            .map(([fieldName, field]) => `${fieldName}: ${String(field.value)} --> ${field.message}`)
            .join('\n'));
}
function isValidateError(response) {
    const payload = response.output.payload;
    return payload.name === 'ValidateError';
}
//# sourceMappingURL=handleFieldValidationErrors.js.map
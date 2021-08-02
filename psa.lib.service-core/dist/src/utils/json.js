"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isoDateStringReviverFn = void 0;
const date_fns_1 = require("date-fns");
function isoDateStringReviverFn(_key, value) {
    if (typeof value === 'string' && isIsoDateString(value)) {
        return new Date(value);
    }
    return value;
}
exports.isoDateStringReviverFn = isoDateStringReviverFn;
function isIsoDateString(value) {
    const possibleDate = date_fns_1.parseISO(value);
    return date_fns_1.isValid(possibleDate);
}
//# sourceMappingURL=json.js.map
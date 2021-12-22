"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLoginToken = void 0;
const authModel_1 = require("../authModel");
function validateLoginToken(db) {
    if (!db) {
        throw new Error('validateLoginToken: Missing database connection. Validation needs database access!');
    }
    return async function (decoded) {
        if (!(0, authModel_1.isLoginToken)(decoded)) {
            return { isValid: false };
        }
        try {
            const result = await db.oneOrNone('SELECT username FROM accounts WHERE username=${username}', {
                username: decoded.username,
            });
            return { isValid: result !== null && result !== undefined };
        }
        catch (err) {
            console.log(err);
            return { isValid: false };
        }
    };
}
exports.validateLoginToken = validateLoginToken;
//# sourceMappingURL=validateLoginToken.js.map
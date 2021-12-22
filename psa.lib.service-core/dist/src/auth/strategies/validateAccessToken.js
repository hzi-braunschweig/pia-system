"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccessToken = void 0;
const authModel_1 = require("../authModel");
function validateAccessToken(db) {
    if (!db) {
        console.warn('validateAccessToken: ' +
            'AccessToken will be checked without database access. ' +
            'This is not allowed for services with qPIA DB access!');
    }
    return async function (decoded) {
        if (!(0, authModel_1.isAccessToken)(decoded)) {
            return { isValid: false };
        }
        if (!db) {
            return { isValid: true };
        }
        try {
            const result = await db.oneOrNone('SELECT username FROM accounts WHERE username=${username} AND role=${role}', {
                username: decoded.username,
                role: decoded.role,
            });
            return { isValid: result !== null && result !== undefined };
        }
        catch (err) {
            console.log(err);
            return { isValid: false };
        }
    };
}
exports.validateAccessToken = validateAccessToken;
//# sourceMappingURL=validateAccessToken.js.map
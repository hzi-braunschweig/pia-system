"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAccessToken = void 0;
function isAccessToken(token) {
    return (!!token['username'] && !!token['locale'] && Array.isArray(token['studies']));
}
exports.isAccessToken = isAccessToken;
//# sourceMappingURL=authModel.js.map
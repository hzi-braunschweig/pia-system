"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLoginToken = exports.isAccessToken = exports.LOGIN_TOKEN_ID = exports.ACCESS_TOKEN_ID = void 0;
exports.ACCESS_TOKEN_ID = 1;
exports.LOGIN_TOKEN_ID = 2;
function isAccessToken(token) {
    return !!token.username && token.id === exports.ACCESS_TOKEN_ID;
}
exports.isAccessToken = isAccessToken;
function isLoginToken(token) {
    return !!token.username && token.id === exports.LOGIN_TOKEN_ID;
}
exports.isLoginToken = isLoginToken;
//# sourceMappingURL=authModel.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiAuthenticator = exports.publicApiSecurity = void 0;
const tsoaAuthenticator_1 = require("./tsoaAuthenticator");
exports.publicApiSecurity = 'jwt-public';
class PublicApiAuthenticator extends tsoaAuthenticator_1.TsoaAuthenticator {
    static async authenticate(securityName, request, authClientSettings) {
        return await new this(this.publicApiSecurityName, authClientSettings).authenticate(securityName, request);
    }
}
exports.PublicApiAuthenticator = PublicApiAuthenticator;
PublicApiAuthenticator.publicApiSecurityName = exports.publicApiSecurity;
//# sourceMappingURL=publicApiAuthenticator.js.map
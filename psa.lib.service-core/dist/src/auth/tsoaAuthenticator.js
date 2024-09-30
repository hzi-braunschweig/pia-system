"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsoaAuthenticator = exports.InvalidAuthorizationTokenError = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = require("jsonwebtoken");
const node_fetch_1 = __importDefault(require("node-fetch"));
const assertStudyAccess_1 = require("./assertStudyAccess");
const errorHandler_1 = require("../plugins/errorHandler");
class InvalidAuthorizationTokenError extends errorHandler_1.SpecificError {
    constructor() {
        super(...arguments);
        this.statusCode = http_status_codes_1.StatusCodes.UNAUTHORIZED;
        this.errorCode = 'INVALID_AUTHORIZATION_TOKEN';
        this.message = 'No or invalid authorization token provided';
    }
}
exports.InvalidAuthorizationTokenError = InvalidAuthorizationTokenError;
class TsoaAuthenticator {
    constructor(securityName, authClientSettings) {
        this.securityName = securityName;
        this.authClientSettings = authClientSettings;
    }
    async authenticate(securityNameOfPath, request) {
        if (securityNameOfPath !== this.securityName) {
            throw new Error('Unknown security configuration');
        }
        const authToken = (request.headers['Authorization'] ||
            request.headers['authorization']);
        if (!authToken) {
            throw new InvalidAuthorizationTokenError();
        }
        const decodedToken = await this.verifyToken(authToken.replace('Bearer', '').trim());
        this.assertStudyAccess(request, decodedToken);
        return decodedToken;
    }
    async verifyToken(authToken) {
        const decodedToken = (0, jsonwebtoken_1.decode)(authToken, {
            json: true,
        });
        if (decodedToken === null || !(await this.isTokenValid(authToken))) {
            throw new InvalidAuthorizationTokenError();
        }
        return decodedToken;
    }
    async isTokenValid(authToken) {
        try {
            const res = await (0, node_fetch_1.default)(`${this.authClientSettings.connection.url}/realms/${this.authClientSettings.realm}/protocol/openid-connect/token/introspect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `client_id=${encodeURIComponent(this.authClientSettings.clientId)}&client_secret=${encodeURIComponent(this.authClientSettings.secret)}&token=${encodeURIComponent(authToken)}`,
            });
            return (await res.json()).active;
        }
        catch (e) {
            return false;
        }
    }
    assertStudyAccess(request, decodedToken) {
        const expectedStudyName = request.params['studyName'];
        if (!expectedStudyName) {
            return;
        }
        if (!decodedToken.studies.includes(expectedStudyName)) {
            throw new assertStudyAccess_1.MissingStudyAccessError(`Requesting user has no access to study "${expectedStudyName}"`);
        }
    }
}
exports.TsoaAuthenticator = TsoaAuthenticator;
//# sourceMappingURL=tsoaAuthenticator.js.map
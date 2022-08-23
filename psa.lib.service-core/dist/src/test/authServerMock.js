"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServerMock = void 0;
const nock_1 = __importDefault(require("nock"));
const http_status_codes_1 = require("http-status-codes");
class AuthServerMock {
    constructor(realmName) {
        this.realmName = realmName;
        this.instance = (0, nock_1.default)('http://authserver:5000').post(`/realms/${this.realmName}/protocol/openid-connect/token/introspect`);
    }
    static probandRealm() {
        return new AuthServerMock('pia-proband-realm');
    }
    static adminRealm() {
        return new AuthServerMock('pia-admin-realm');
    }
    static cleanAll() {
        nock_1.default.cleanAll();
    }
    returnError(message) {
        return this.instance.replyWithError(message ?? 'AuthServerMock error');
    }
    returnInvalid() {
        return this.instance.reply(http_status_codes_1.StatusCodes.OK, { active: false });
    }
    returnValid() {
        return this.instance.reply(http_status_codes_1.StatusCodes.OK, { active: true });
    }
}
exports.AuthServerMock = AuthServerMock;
//# sourceMappingURL=authServerMock.js.map
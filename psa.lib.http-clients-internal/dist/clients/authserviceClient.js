"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class AuthserviceClient extends serviceClient_1.ServiceClient {
    async createAccount(user) {
        return await this.httpClient.post('/auth/user', user);
    }
    async deleteAccount(username) {
        await this.httpClient.delete('/auth/user/' + username);
    }
}
exports.AuthserviceClient = AuthserviceClient;
//# sourceMappingURL=authserviceClient.js.map
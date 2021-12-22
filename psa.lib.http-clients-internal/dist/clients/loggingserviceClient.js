"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class LoggingserviceClient extends serviceClient_1.ServiceClient {
    async createSystemLog(log) {
        return await this.httpClient.post('/log/systemLogs', log);
    }
}
exports.LoggingserviceClient = LoggingserviceClient;
//# sourceMappingURL=loggingserviceClient.js.map
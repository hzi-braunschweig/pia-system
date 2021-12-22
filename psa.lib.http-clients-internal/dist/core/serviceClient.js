"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceClient = void 0;
const util_1 = __importDefault(require("util"));
const httpClient_1 = require("./httpClient");
class ServiceClient {
    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
        this.httpClient = new httpClient_1.HttpClient(this.serviceUrl);
    }
    async waitForService(retryCount = 24, delay = 5000) {
        const sleep = util_1.default.promisify(setTimeout);
        if (retryCount <= 0)
            throw new Error('retryCount must be greater than 0');
        for (let i = 0; i <= retryCount; i++) {
            try {
                await httpClient_1.HttpClient.fetch(this.serviceUrl);
                return;
            }
            catch (e) {
                console.log(`${this.serviceUrl}: service is not yet available. Waiting for ${delay} ms before next retry.`);
                if (i < retryCount)
                    await sleep(delay);
            }
        }
        throw new Error(`${this.serviceUrl}: Could not reach service after ${retryCount} retries`);
    }
}
exports.ServiceClient = ServiceClient;
//# sourceMappingURL=serviceClient.js.map
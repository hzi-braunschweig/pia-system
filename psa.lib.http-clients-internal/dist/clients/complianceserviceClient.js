"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceserviceClient = exports.SystemComplianceType = void 0;
const serviceClient_1 = require("../core/serviceClient");
var SystemComplianceType;
(function (SystemComplianceType) {
    SystemComplianceType["APP"] = "app";
    SystemComplianceType["SAMPLES"] = "samples";
    SystemComplianceType["BLOODSAMPLES"] = "bloodsamples";
    SystemComplianceType["LABRESULTS"] = "labresults";
})(SystemComplianceType = exports.SystemComplianceType || (exports.SystemComplianceType = {}));
class ComplianceserviceClient extends serviceClient_1.ServiceClient {
    async hasAgreedToCompliance(pseudonym, study, systemCompliance) {
        let query;
        if (Array.isArray(systemCompliance)) {
            query =
                '?' + systemCompliance.map((comp) => 'system[]=' + comp).join('&');
        }
        else {
            query = '?system=' + systemCompliance;
        }
        return await this.httpClient.get(`/compliance/${study}/agree/${pseudonym}` + query);
    }
}
exports.ComplianceserviceClient = ComplianceserviceClient;
//# sourceMappingURL=complianceserviceClient.js.map
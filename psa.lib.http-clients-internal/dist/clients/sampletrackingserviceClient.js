"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampletrackingserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class SampletrackingserviceClient extends serviceClient_1.ServiceClient {
    async patchSample(studyName, pseudonym, sampleId, sample) {
        return await this.httpClient.patch(`/study/${studyName}/participants/${pseudonym}/samples/${sampleId}`, sample, {
            returnNullWhenNotFound: false,
        });
    }
}
exports.SampletrackingserviceClient = SampletrackingserviceClient;
//# sourceMappingURL=sampletrackingserviceClient.js.map
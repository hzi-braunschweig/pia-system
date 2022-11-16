"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaldataserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class PersonaldataserviceClient extends serviceClient_1.ServiceClient {
    async updatePersonalData(pseudonym, personalData, skipUpdateAccount = false) {
        let query = '';
        if (skipUpdateAccount) {
            query = '?skipUpdateAccount=true';
        }
        return await this.httpClient.put(`/personal/personalData/proband/${pseudonym}${query}`, personalData);
    }
    async getPersonalDataEmail(pseudonym) {
        return await this.httpClient.get(`/personal/personalData/proband/${pseudonym}/email`, {
            responseType: 'text',
            returnNullWhenNotFound: true,
        });
    }
    async deletePersonalDataOfUser(pseudonym) {
        return await this.httpClient.delete(`/personal/personalData/proband/${pseudonym}`);
    }
}
exports.PersonaldataserviceClient = PersonaldataserviceClient;
//# sourceMappingURL=personaldataserviceClient.js.map
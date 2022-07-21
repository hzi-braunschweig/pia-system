"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class UserserviceClient extends serviceClient_1.ServiceClient {
    async getPseudonyms(filter = {}) {
        const query = new URLSearchParams();
        if (typeof filter.study === 'string') {
            query.append('study', filter.study);
        }
        if (typeof filter.complianceContact === 'boolean') {
            query.append('complianceContact', filter.complianceContact.toString());
        }
        if (typeof filter.probandStatus === 'string') {
            query.append('status', filter.probandStatus);
        }
        else if (Array.isArray(filter.probandStatus)) {
            filter.probandStatus.forEach((status) => query.append('status', status));
        }
        return await this.httpClient.get(`/user/pseudonyms?${query.toString()}`);
    }
    async getExternalIds(filter) {
        const query = new URLSearchParams();
        query.append('study', filter.study);
        query.append('complianceContact', filter.complianceContact.toString());
        return await this.httpClient.get(`/user/externalIds?${query.toString()}`);
    }
    async lookupIds(pseudonym) {
        return await this.httpClient.get(`/user/users/${pseudonym}/ids`, {
            responseType: 'text',
            returnNullWhenNotFound: true,
        });
    }
    async lookupMappingId(pseudonym) {
        return await this.httpClient.get(`/user/users/${pseudonym}/mappingId`, {
            responseType: 'text',
        });
    }
    async retrieveUserExternalCompliance(pseudonym) {
        return await this.httpClient.get(`/user/users/${pseudonym}/externalcompliance`);
    }
    async getProbandsWithAccessToFromProfessional(username) {
        return await this.httpClient.get(`/user/professional/${username}/allProbands`);
    }
    async getProband(pseudonym) {
        return await this.httpClient.get(`/user/users/${pseudonym}`, { returnNullWhenNotFound: true });
    }
    async isProbandExistentByUsername(pseudonym) {
        return (await this.getProband(pseudonym)) !== null;
    }
    async getStudyOfProband(pseudonym) {
        const proband = await this.getProband(pseudonym);
        return proband?.study ?? null;
    }
    async deleteProbanddata(pseudonym, keepUsageData, isFullDeletion) {
        const params = new URLSearchParams({
            keepUsageData: keepUsageData.toString(),
            full: isFullDeletion.toString(),
        });
        return await this.httpClient.delete(`/user/users/${pseudonym}?${params.toString()}`);
    }
    async getProbandByIDS(ids) {
        return await this.httpClient.get(`/user/users/ids/${ids}`, {
            returnNullWhenNotFound: true,
        });
    }
    async registerProband(studyName, newProband) {
        return await this.httpClient.post(`/user/studies/${studyName}/probands`, newProband);
    }
    async getStudy(studyName) {
        return await this.httpClient.get(`/user/studies/${studyName}`, {
            returnNullWhenNotFound: true,
        });
    }
    async patchProband(pseudonym, attributes) {
        return await this.httpClient.patch(`/user/users/${pseudonym}`, attributes);
    }
}
exports.UserserviceClient = UserserviceClient;
//# sourceMappingURL=userserviceClient.js.map
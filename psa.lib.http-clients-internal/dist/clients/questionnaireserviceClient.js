"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
class QuestionnaireserviceClient extends serviceClient_1.ServiceClient {
    static convertQuestionnaireInstanceDates(qinstance) {
        const newInstance = {
            ...qinstance,
            dateOfIssue: new Date(qinstance.dateOfIssue),
            dateOfReleaseV1: qinstance.dateOfReleaseV1 && new Date(qinstance.dateOfReleaseV1),
            dateOfReleaseV2: qinstance.dateOfReleaseV2 && new Date(qinstance.dateOfReleaseV2),
            transmissionTsV1: qinstance.transmissionTsV1 && new Date(qinstance.transmissionTsV1),
            transmissionTsV2: qinstance.transmissionTsV2 && new Date(qinstance.transmissionTsV2),
        };
        if ('questionnaire' in qinstance) {
            return {
                ...newInstance,
                questionnaire: QuestionnaireserviceClient.convertQuestionnaireDates(qinstance.questionnaire),
            };
        }
        return newInstance;
    }
    static convertQuestionnaireDates(questionnaire) {
        return {
            ...questionnaire,
            activateAtDate: questionnaire.activateAtDate && new Date(questionnaire.activateAtDate),
            createdAt: questionnaire.createdAt && new Date(questionnaire.createdAt),
            updatedAt: questionnaire.updatedAt && new Date(questionnaire.updatedAt),
        };
    }
    async getQuestionnaireInstancesForProband(pseudonym) {
        const params = new URLSearchParams();
        params.append('loadQuestionnaire', String(false));
        const query = '?' + params.toString();
        const instances = await this.httpClient.get(`/questionnaire/user/${pseudonym}/questionnaireInstances` + query);
        return instances.map((instance) => QuestionnaireserviceClient.convertQuestionnaireInstanceDates(instance));
    }
    async getQuestionnaireInstance(id, filterQuestionnaireByConditions) {
        const params = new URLSearchParams();
        params.append('filterQuestionnaireByConditions', String(filterQuestionnaireByConditions ?? false));
        const query = '?' + params.toString();
        const result = await this.httpClient.get(`/questionnaire/questionnaireInstances/${id.toString()}` + query);
        return QuestionnaireserviceClient.convertQuestionnaireInstanceDates(result);
    }
    async getQuestionnaireInstanceAnswers(id) {
        return await this.httpClient.get(`/questionnaire/questionnaireInstances/${id.toString()}/answers`);
    }
}
exports.QuestionnaireserviceClient = QuestionnaireserviceClient;
//# sourceMappingURL=questionnaireserviceClient.js.map
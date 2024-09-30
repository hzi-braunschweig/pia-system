"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionnaireserviceClient = void 0;
const serviceClient_1 = require("../core/serviceClient");
const httpClient_1 = require("../core/httpClient");
const http_status_codes_1 = require("http-status-codes");
const boom_1 = __importDefault(require("@hapi/boom"));
const jsonChunksParserTransform_1 = require("../core/jsonChunksParserTransform");
class QuestionnaireserviceClient extends serviceClient_1.ServiceClient {
    static convertQuestionnaireInstanceDates(qinstance) {
        const newInstance = {
            ...qinstance,
            dateOfIssue: new Date(qinstance.dateOfIssue),
            dateOfReleaseV1: qinstance.dateOfReleaseV1 && new Date(qinstance.dateOfReleaseV1),
            dateOfReleaseV2: qinstance.dateOfReleaseV2 && new Date(qinstance.dateOfReleaseV2),
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
    async getQuestionnaire(id, version) {
        return await this.httpClient.get(`/questionnaire/${id.toString()}/${version.toString()}`);
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
    async createQuestionnaireInstances(instances) {
        return this.httpClient.post('/questionnaire/questionnaireInstances', instances);
    }
    async getQuestionnaireAnswers(id, filter) {
        const params = new URLSearchParams();
        if (filter.status) {
            filter.status.forEach((status) => params.append('status', status));
        }
        if (filter.minDateOfIssue) {
            params.append('minDateOfIssue', filter.minDateOfIssue.toISOString());
        }
        if (filter.maxDateOfIssue) {
            params.append('maxDateOfIssue', filter.maxDateOfIssue.toISOString());
        }
        if (filter.answerOptions && filter.answerOptions.length > 0) {
            filter.answerOptions
                .map((a) => a.id)
                .filter(Boolean)
                .forEach((answerOptionId) => params.append('answerOptionIds', answerOptionId.toString()));
            filter.answerOptions
                .map((a) => a.variableName)
                .filter(Boolean)
                .forEach((variableName) => params.append('answerOptionVariableNames', variableName.toString()));
        }
        const url = `${this.serviceUrl}/questionnaire/${id.toString()}/answers?${params.toString()}`;
        const res = await httpClient_1.HttpClient.fetch(url);
        if (!res.ok) {
            if (res.status === http_status_codes_1.StatusCodes.NOT_FOUND) {
                throw boom_1.default.notFound(`GET ${url} received a 404 Not Found`);
            }
            throw boom_1.default.internal(`GET ${url} received an Error`, await res.text(), res.status);
        }
        return res.body.pipe(new jsonChunksParserTransform_1.JsonChunksParserTransform());
    }
}
exports.QuestionnaireserviceClient = QuestionnaireserviceClient;
//# sourceMappingURL=questionnaireserviceClient.js.map
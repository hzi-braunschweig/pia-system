/// <reference types="node" />
import { ServiceClient } from '../core/serviceClient';
import { QuestionnaireInstanceInternalDto, QuestionnaireInstanceWithQuestionnaireInternalDto, CreateQuestionnaireInstanceInternalDto } from '../dtos/questionnaireInstance';
import { AnswerInternalDto, AnswersFilterInternalDto } from '../dtos/answer';
import { QuestionnaireInternalDto } from '../dtos/questionnaire';
export declare class QuestionnaireserviceClient extends ServiceClient {
    private static convertQuestionnaireInstanceDates;
    private static convertQuestionnaireDates;
    getQuestionnaire(id: number, version: number): Promise<QuestionnaireInternalDto>;
    getQuestionnaireInstancesForProband(pseudonym: string): Promise<QuestionnaireInstanceInternalDto[]>;
    getQuestionnaireInstance(id: number, filterQuestionnaireByConditions?: boolean): Promise<QuestionnaireInstanceWithQuestionnaireInternalDto>;
    getQuestionnaireInstanceAnswers(id: number): Promise<AnswerInternalDto[]>;
    createQuestionnaireInstances(instances: CreateQuestionnaireInstanceInternalDto[]): Promise<CreateQuestionnaireInstanceInternalDto[]>;
    getQuestionnaireAnswers(id: number, filter: AnswersFilterInternalDto): Promise<NodeJS.ReadableStream>;
}

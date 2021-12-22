import { ServiceClient } from '../core/serviceClient';
import { QuestionnaireInstanceInternalDto, QuestionnaireInstanceWithQuestionnaireInternalDto } from '../dtos/questionnaireInstance';
import { AnswerInternalDto } from '../dtos/answer';
export declare class QuestionnaireserviceClient extends ServiceClient {
    private static convertQuestionnaireInstanceDates;
    private static convertQuestionnaireDates;
    getQuestionnaireInstancesForProband(pseudonym: string): Promise<QuestionnaireInstanceInternalDto[]>;
    getQuestionnaireInstance(id: number): Promise<QuestionnaireInstanceWithQuestionnaireInternalDto>;
    getQuestionnaireInstanceAnswers(id: number): Promise<AnswerInternalDto[]>;
}

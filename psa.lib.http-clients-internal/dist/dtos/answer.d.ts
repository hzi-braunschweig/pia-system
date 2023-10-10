import { AnswerOptionInternalDto } from './answerOption';
import { QuestionnaireInstanceStatus } from './questionnaireInstance';
export interface AnswerInternalDto {
    answerOption: AnswerOptionInternalDto;
    versioning: number;
    value: string;
    dateOfRelease: Date | null;
    releasingPerson: string | null;
}
export interface AnswerDataInternalDto {
    questionnaireId: number;
    questionnaireInstanceId: number;
    questionnaireInstanceDateOfIssue: string;
    answerOptionId: number;
    answerOptionVariableName: string | null;
    values: string[];
}
export interface AnswersFilterInternalDto {
    status?: QuestionnaireInstanceStatus[];
    minDateOfIssue?: Date;
    maxDateOfIssue?: Date;
    answerOptions?: AnswerOptionReferenceInternalDto[];
}
export interface AnswerOptionReferenceInternalDto {
    id?: number;
    variableName?: string;
}

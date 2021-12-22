import { AnswerOptionInternalDto } from './answerOption';
export interface AnswerInternalDto {
    answerOption: AnswerOptionInternalDto;
    versioning: number;
    value: string;
    dateOfRelease: Date | null;
    releasingPerson: string | null;
}

import { ConditionInternalDto } from './condition';
import { QuestionnaireInternalDto } from './questionnaire';
import { AnswerOptionInternalDto } from './answerOption';
export interface QuestionInternalDto {
    id: number;
    isMandatory: boolean | null;
    position: number;
    text: string;
    questionnaire?: QuestionnaireInternalDto;
    answerOptions?: AnswerOptionInternalDto[];
    condition?: ConditionInternalDto | null;
}

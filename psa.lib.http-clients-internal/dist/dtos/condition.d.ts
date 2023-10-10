import { QuestionInternalDto } from './question';
import { QuestionnaireInternalDto } from './questionnaire';
import { AnswerOptionInternalDto } from './answerOption';
export declare enum ConditionType {
    INTERNAL_THIS = "internal_this",
    INTERNAL_LAST = "internal_last",
    EXTERNAL = "external"
}
export type ConditionOperand = '<' | '>' | '<=' | '>=' | '==' | '\\=';
export type ConditionLink = 'AND' | 'OR' | 'XOR';
export interface ConditionInternalDto {
    id: number;
    type: ConditionType | null;
    value: string | null;
    link: ConditionLink | null;
    operand: ConditionOperand | null;
    targetAnswerOption?: AnswerOptionInternalDto | null;
    targetQuestionnaire?: QuestionnaireInternalDto | null;
    conditionAnswerOption?: AnswerOptionInternalDto | null;
    conditionQuestion?: QuestionInternalDto | null;
    conditionQuestionnaire?: QuestionnaireInternalDto | null;
}

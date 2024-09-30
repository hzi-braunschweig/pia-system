import { QuestionnaireInternalDto } from './questionnaire';
export declare type QuestionnaireInstanceStatus = 'inactive' | 'active' | 'in_progress' | 'released' | 'released_once' | 'released_twice' | 'expired' | 'deleted';
export interface QuestionnaireInstanceInternalDto {
    id: number;
    studyId: string;
    questionnaireName: string;
    pseudonym: string;
    dateOfIssue: Date;
    dateOfReleaseV1: Date | null;
    dateOfReleaseV2: Date | null;
    cycle: number;
    status: QuestionnaireInstanceStatus;
    notificationsScheduled: boolean | null;
    progress: number | null;
    releaseVersion: number | null;
}
export interface CreateQuestionnaireInstanceInternalDto extends Omit<QuestionnaireInstanceInternalDto, 'id' | 'dateOfReleaseV1' | 'dateOfReleaseV2' | 'notificationsScheduled' | 'progress' | 'releaseVersion'> {
    id?: number;
    questionnaireId: number;
    questionnaireVersion: number;
    sortOrder: number | null;
    status: Extract<QuestionnaireInstanceStatus, 'inactive' | 'active' | 'expired'>;
    origin: QuestionnaireInstanceOriginInternalDto | null;
    options?: {
        addToQueue?: boolean;
    };
}
export interface QuestionnaireInstanceWithQuestionnaireInternalDto extends QuestionnaireInstanceInternalDto {
    questionnaire: QuestionnaireInternalDto;
}
export interface QuestionnaireInstanceOriginInternalDto {
    createdInstance?: number;
    originInstance: number;
    condition: number;
}

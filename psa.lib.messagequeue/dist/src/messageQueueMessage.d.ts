export interface ProbandCreatedMessage {
    pseudonym: string;
    studyName: string;
}
export interface ProbandDeletedMessage {
    pseudonym: string;
    studyName: string;
    deletionType: 'default' | 'keep_usage_data' | 'full';
}
export interface ProbandDeactivatedMessage {
    pseudonym: string;
    studyName: string;
}
export interface ProbandEmailVerifiedMessage {
    pseudonym: string;
    studyName: string;
}
export interface ProbandLoggedInMessage {
    pseudonym: string;
    studyName: string;
}
export interface ComplianceCreatedMessage {
    pseudonym: string;
    studyName: string;
}
export interface ProbandRegisteredMessage {
    username: string;
    studyName: string;
}
export interface StudyDeletedMessage {
    studyName: string;
}
export interface QuestionnaireInstanceReleasedMessage {
    id: number;
    releaseVersion: number;
    studyName: string;
}
export interface FeedbackStatisticConfigurationUpdatedMessage {
    configurationId: number;
}
export declare type MessageQueueMessage = ProbandCreatedMessage | ProbandDeletedMessage | ProbandDeactivatedMessage | ProbandEmailVerifiedMessage | ProbandLoggedInMessage | ProbandRegisteredMessage | ComplianceCreatedMessage | StudyDeletedMessage | QuestionnaireInstanceReleasedMessage | FeedbackStatisticConfigurationUpdatedMessage;

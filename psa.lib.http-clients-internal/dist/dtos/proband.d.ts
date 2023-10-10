export declare enum AccountStatus {
    ACCOUNT = "account",
    NO_ACCOUNT = "no_account"
}
export declare enum ProbandStatus {
    ACTIVE = "active",
    DEACTIVATED = "deactivated",
    DELETED = "deleted"
}
export interface StudyAccess {
    study_id: string;
    access_level: AccessLevel;
}
export type AccessLevel = 'read' | 'write' | 'admin';
export interface ProbandInternalDto {
    pseudonym: string;
    study: string;
    firstLoggedInAt: string | null;
    complianceLabresults: boolean;
    complianceSamples: boolean;
    complianceBloodsamples: boolean;
    complianceContact: boolean;
    accountStatus: AccountStatus;
    status: ProbandStatus;
    ids: string | null;
    isTestProband: boolean;
}
export type ProbandRequestInternalDto = Omit<ProbandResponseInternalDto, 'pseudonym' | 'password' | 'study'>;
export declare enum ProbandOrigin {
    SELF = "self",
    INVESTIGATOR = "investigator",
    SORMAS = "sormas"
}
export interface ProbandResponseInternalDto {
    pseudonym: string;
    password: string;
    study: string;
    ids: string | null;
    complianceLabresults: boolean;
    complianceSamples: boolean;
    complianceBloodsamples: boolean;
    studyCenter: string | null;
    examinationWave: number;
    origin: ProbandOrigin;
}
export interface ProbandExternalIdResponseInternalDto {
    pseudonym: string;
    externalId: string;
}

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
export declare type AccessLevel = 'read' | 'write' | 'admin';
export interface ProbandInternalDto {
    pseudonym: string;
    role: 'Proband';
    study: string;
    first_logged_in_at: string | null;
    complianceLabresults: boolean;
    complianceSamples: boolean;
    complianceBloodsamples: boolean;
    complianceContact: boolean;
    accountStatus: AccountStatus;
    status: ProbandStatus;
    ids: string | null;
    study_accesses: StudyAccess[];
}
export declare type ProbandRequestInternalDto = Omit<ProbandResponseInternalDto, 'password' | 'study'>;
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
}

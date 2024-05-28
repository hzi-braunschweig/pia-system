export declare enum LabResultStatus {
    New = "new",
    Analyzed = "analyzed",
    Inactive = "inactive"
}
export declare enum LabResultStudyStatus {
    Active = "active",
    Deactivated = "deactivated",
    DeletionPending = "deletion_pending",
    Deleted = "deleted"
}
export interface LabResultInternalDto {
    id: string;
    dummyId: string;
    pseudonym: string;
    dateOfSampling: Date | null;
    remark: string | null;
    status: LabResultStatus;
    newSamplesSent: boolean | null;
    performingDoctor: string | null;
    studyStatus: LabResultStudyStatus;
}

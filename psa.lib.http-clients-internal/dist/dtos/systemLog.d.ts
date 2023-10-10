export type SystemLogRequestInternalDto = Omit<SystemLogInternalDto, 'timestamp'>;
export interface SystemLogInternalDto {
    requestedBy: string;
    requestedFor: string;
    timestamp: string;
    type: 'proband' | 'sample' | 'study' | 'compliance' | 'study_change' | 'partial' | 'personal';
}

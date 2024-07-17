export interface PendingPersonalDataDeletion {
    id: number;
    requested_by: string;
    requested_for: string;
    proband_id: string;
    study: string;
}

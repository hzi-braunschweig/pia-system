export interface PendingDeletionReq {
  requested_by: string;
  requested_for: string;
  proband_id: string;
}

export interface PendingDeletionDb extends PendingDeletionReq {
  study: string;
}

export interface PendingDeletionRes extends PendingDeletionDb {
  id: number;
}

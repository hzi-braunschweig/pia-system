export interface PendingPartialDeletionResponse {
  id: number;
  requestedBy: string;
  requestedFor: string;
  probandId: string;
  fromDate: Date;
  toDate: Date;
  deleteLogs: boolean;
  forInstanceIds: number[] | null;
  forLabResultsIds: string[] | null;
}

export interface PendingPartialDeletionRequest {
  requestedFor: string;
  probandId: string;
  fromDate: Date;
  toDate: Date;
  deleteLogs: boolean;
  forInstanceIds: number[] | null;
  forLabResultsIds: string[] | null;
}

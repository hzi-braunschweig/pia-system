export type SystemLogType =
  | 'personal'
  | 'proband'
  | 'sample'
  | 'study'
  | 'compliance'
  | 'study_change'
  | 'partial';

export interface SystemLog {
  requestedBy: string;
  requestedFor: string;
  timestamp: Date;
  type: SystemLogType;
}

export interface SystemLogFilter {
  fromTime?: string;
  toTime?: string;
  types: SystemLogType[];
}

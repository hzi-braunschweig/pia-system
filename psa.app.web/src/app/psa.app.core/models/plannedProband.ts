import { StudyAccess } from './study_access';

export class PlannedProband {
  user_id: string;
  password: string;
  activated_at: Date;
  wasCreated: boolean;
  studies?: string;
  study_accesses?: StudyAccess[];
}

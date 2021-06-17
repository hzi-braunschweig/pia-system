export class UserListResponse {
  users: UserWithStudyAccess[];
  links: { self: { href: string } };
}

export class UserWithStudyAccess {
  age: number;
  username: string;
  role: string;
  sex: string;
  password: string;
  is_test_proband: boolean;
  study_accesses: StudyAccess[];
  studyNamesArray: string[];
  first_logged_in_at: string;
  account_status: AccountStatus;
  study_status: StudyStatus;
  compliance_labresults: boolean = false;
  compliance_samples: boolean = false;
  compliance_bloodsamples: boolean = false;
  ids?: string;
  needs_material: boolean;
  pendingComplianceChange?: boolean = false; // Not from backend
}

export class StudyAccess {
  study_id: string;
  access_level: AccessLevel;
}

export type AccountStatus =
  | 'active'
  | 'deactivation_pending'
  | 'deactivated'
  | 'no_account';
export type StudyStatus = 'active' | 'deletion_pending' | 'deleted';
export type AccessLevel = 'read' | 'write' | 'admin';

export interface SormasProband {
  pseudonym: string;
  password: string | null; // null if registration mail was successfully sent
}

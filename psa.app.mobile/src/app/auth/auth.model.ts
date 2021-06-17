// tslint:disable:variable-name

export type LoginPlatform = 'android' | 'ios' | 'web';

export interface Login {
  logged_in_with: LoginPlatform;
  username: string;
  password: string;
  locale: string;
}

export interface User {
  id: number;
  username: string;
  password: string;
  token: string;
  token_login: string;
  logged_in_with: string;
  first_logged_in_at: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  needs_material: boolean;
  pw_change_needed: boolean;
  role: string;
  study_center: string;
  examination_wave: number;
  logging_active: boolean;
}

export class UserWithStudyAccess {
  age: number;
  username: string;
  role: string;
  sex: string;
  password: string;

  study_accesses: StudyAccess[];
  studyNamesArray: string[];
  first_logged_in_at: string;
}

export class StudyAccess {
  study_id: string;
  access_level: string;
}

export interface PasswordChange {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
  username: string;
}

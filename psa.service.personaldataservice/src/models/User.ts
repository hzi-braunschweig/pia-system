export type Role =
  | 'Proband'
  | 'Forscher'
  | 'Untersuchungsteam'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'SysAdmin';

export type AccountStatus =
  | 'active'
  | 'deactivated'
  | 'deactivation_pending'
  | 'no_account';

export interface User {
  username: string;
  password?: string;
  role?: Role;
  pw_change_needed?: boolean;
  initial_password_validity_date?: Date;
  account_status?: AccountStatus;
}

export type Role =
  | 'Proband'
  | 'Forscher'
  | 'Untersuchungsteam'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'SysAdmin';

export interface AccessToken {
  role: Role;
  username: string;
  groups: string[];
}

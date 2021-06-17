import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';

export interface TranslatedUser {
  username: string;
  ids: string | null;
  study_accesses: string;
  is_test_proband: string;
  first_logged_in_at: string;
  status: string;
  userObject: UserWithStudyAccess;
}

import { Pipe, PipeTransform } from '@angular/core';
import { UserWithStudyAccess } from '../psa.app.core/models/user-with-study-access';

/**
 * Returns the translation key of an account status
 */
@Pipe({ name: 'accountStatus' })
export class AccountStatusPipe implements PipeTransform {
  transform(entityWithStatus: UserWithStudyAccess): string | null {
    if (
      entityWithStatus.account_status === 'active' &&
      entityWithStatus.study_status === 'active'
    ) {
      return 'STUDIES.STATUS_ACTIV';
    } else if (entityWithStatus.study_status === 'deletion_pending') {
      return 'STUDIES.STATUS_DELETION_PENDING';
    } else if (entityWithStatus.study_status === 'deleted') {
      return 'STUDIES.STATUS_DELETED';
    } else if (entityWithStatus.account_status === 'deactivation_pending') {
      return 'PROBANDEN.STATUS_DEACTIVATION_PENDING';
    } else if (entityWithStatus.account_status === 'deactivated') {
      return 'PROBANDEN.STATUS_DEACTIVATED';
    } else if (entityWithStatus.account_status === 'no_account') {
      return 'PROBANDEN.STATUS_NO_ACCOUNT';
    }
    return null;
  }
}

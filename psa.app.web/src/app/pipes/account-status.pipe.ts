/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { Proband } from '../psa.app.core/models/proband';

/**
 * Returns the translation key of an account status
 */
@Pipe({ name: 'accountStatusConvert' })
export class AccountStatusPipe implements PipeTransform {
  public transform(
    entityWithStatus: Pick<Proband, 'accountStatus' | 'status'>
  ): string {
    if (
      entityWithStatus.accountStatus === 'account' &&
      entityWithStatus.status === 'active'
    ) {
      return 'PROBANDEN.STATUS_ACTIVE';
    }
    if (
      entityWithStatus.accountStatus === 'no_account' &&
      entityWithStatus.status === 'active'
    ) {
      return 'PROBANDEN.STATUS_ACTIVE_NO_ACCOUNT';
    }
    if (
      entityWithStatus.accountStatus === 'account' &&
      entityWithStatus.status === 'deactivated'
    ) {
      return 'PROBANDEN.STATUS_DEACTIVATED';
    }
    if (
      entityWithStatus.accountStatus === 'no_account' &&
      entityWithStatus.status === 'deactivated'
    ) {
      return 'PROBANDEN.STATUS_COMMUNICATION_BAN';
    }
    if (
      entityWithStatus.accountStatus === 'no_account' &&
      entityWithStatus.status === 'deleted'
    ) {
      return 'PROBANDEN.STATUS_DELETED';
    }
    return 'UNDEFINED';
  }
}

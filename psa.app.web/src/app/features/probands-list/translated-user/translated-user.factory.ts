/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { TranslatedUser } from './translated-user.model';
import { Proband } from '../../../psa.app.core/models/proband';

@Injectable()
export class TranslatedUserFactory {
  constructor(
    private readonly translate: TranslateService,
    private readonly accountStatusPipe: AccountStatusPipe
  ) {}

  public create(user: Proband): TranslatedUser {
    return {
      username: user.pseudonym,
      ids: user.ids,
      study: user.study,
      is_test_proband: this.translate.instant(
        user.isTestProband ? 'GENERAL.YES' : 'GENERAL.NO'
      ),
      first_logged_in_at: user.firstLoggedInAt,
      status: this.translate.instant(this.accountStatusPipe.transform(user)),
      userObject: user,
    };
  }
}

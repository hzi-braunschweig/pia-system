/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { StudyAccessPipe } from '../../../pipes/study-access.pipe';
import { DatePipe } from '@angular/common';
import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';
import { TranslatedUser } from './translated-user.model';

@Injectable()
export class TranslatedUserFactory {
  constructor(
    private readonly translate: TranslateService,
    private readonly accountStatusPipe: AccountStatusPipe,
    private readonly studyAccessPipe: StudyAccessPipe,
    private readonly datePipe: DatePipe
  ) {}

  create(user: UserWithStudyAccess): TranslatedUser {
    return {
      username: user.username,
      ids: user.ids,
      study_accesses: this.studyAccessPipe.transform(user.study_accesses),
      is_test_proband: this.translate.instant(
        user.is_test_proband ? 'GENERAL.YES' : 'GENERAL.NO'
      ),
      first_logged_in_at: this.datePipe.transform(user.first_logged_in_at),
      status: this.translate.instant(this.accountStatusPipe.transform(user)),
      userObject: user,
    };
  }
}

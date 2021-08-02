/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserWithStudyAccess } from '../../app/psa.app.core/models/user-with-study-access';
import { AlertService } from '../_services/alert.service';
import { TranslateService } from '@ngx-translate/core';

/** An questionnaire database that the data source uses to retrieve data for the table. */
export class ProbandsDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<UserWithStudyAccess[]> = new BehaviorSubject<
    UserWithStudyAccess[]
  >([]);
  get data(): UserWithStudyAccess[] {
    return this.dataChange.value;
  }

  constructor(
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  deleteProband(username: string) {
    this.authService.deleteUser(username).then(
      (result: any) => {
        const succesText = result.body;
        const copiedData = this.data;
        const index = copiedData.findIndex((d) => d.username === username);
        copiedData.splice(index, 1);
        this.dataChange.next(copiedData);
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );
  }

  insertData(probands) {
    this.dataChange.next(probands);
  }
}

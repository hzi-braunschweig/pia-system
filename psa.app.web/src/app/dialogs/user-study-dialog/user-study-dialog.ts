/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnDestroy } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { Observable, Subscription } from 'rxjs';
import {
  DialogOkCancelComponent,
  DialogOkCancelComponentData,
  DialogOkCancelComponentReturn,
} from 'src/app/_helpers/dialog-ok-cancel';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, shareReplay, startWith } from 'rxjs/operators';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { AccessLevel } from '../../psa.app.core/models/studyAccess';
import { ProfessionalAccount } from '../../psa.app.core/models/professionalAccount';
import { ProfessionalRole } from '../../psa.app.core/models/user';

export interface DialogUserStudyAccessComponentData {
  studyName: string;
}
export type DialogUserStudyAccessComponentReturn = boolean;

@Component({
  selector: 'dialog-user-study',
  templateUrl: 'user-study-dialog.html',
})
export class DialogUserStudyAccessComponent implements OnDestroy {
  public roles: { value: ProfessionalRole; viewValue: string }[] = [
    { value: 'Forscher', viewValue: 'ROLES.RESEARCHER' },
    { value: 'ProbandenManager', viewValue: 'ROLES.PROBANDS_MANAGER' },
    { value: 'EinwilligungsManager', viewValue: 'ROLES.COMPLIANCE_MANAGER' },
    { value: 'Untersuchungsteam', viewValue: 'ROLES.RESEARCH_TEAM' },
  ];
  public selectedRole = new FormControl(null);
  public form: FormGroup = new FormGroup({
    username: new FormControl(
      { value: null, disabled: true },
      Validators.required
    ),
    accessLevel: new FormControl(
      { value: null, disabled: true },
      Validators.required
    ),
  });

  public usernameFilterCtrl: FormControl = new FormControl('');
  public filteredUsers: Observable<ProfessionalAccount[]>;

  public isLoading = false;

  private studyName: string;

  private subscription: Subscription;

  public readonly accesses = [
    { value: 'read', viewValue: 'DIALOG.READ' },
    { value: 'write', viewValue: 'DIALOG.WRITE' },
    { value: 'admin', viewValue: 'DIALOG.ADMIN' },
  ];

  public constructor(
    @Inject(MAT_DIALOG_DATA) data: DialogUserStudyAccessComponentData,
    public dialogRef: MatDialogRef<
      DialogUserStudyAccessComponent,
      DialogUserStudyAccessComponentReturn
    >,
    private alertService: AlertService,
    private userService: UserService,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {
    this.studyName = data.studyName;
    this.subscription = this.selectedRole.valueChanges.subscribe(
      (role: ProfessionalRole) => this.fetchUsersForRole(role)
    );
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public submit(): void {
    this.matDialog
      .open<
        DialogOkCancelComponent,
        DialogOkCancelComponentData,
        DialogOkCancelComponentReturn
      >(DialogOkCancelComponent, {
        width: '450px',
        data: {
          content: this.translate.instant('DIALOG.CONFIRM_STUDY_ACCESS', {
            user: this.form.get('username').value,
            study: this.studyName,
          }),
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'ok'))
      .subscribe(async () => {
        try {
          await this.userService.postStudyAccess({
            studyName: this.studyName,
            username: this.form.get('username').value,
            accessLevel: this.form.get('accessLevel').value as AccessLevel,
          });
          this.dialogRef.close(true);
        } catch (err) {
          this.alertService.errorObject(err);
        }
      });
  }

  private async fetchUsersForRole(role: ProfessionalRole): Promise<void> {
    this.isLoading = true;
    this.form.setValue({
      username: null,
      accessLevel: null,
    });
    this.form.disable();
    try {
      const usersOutsideStudy = (
        await this.userService.getProfessionalAccounts({
          role,
        })
      ).filter((user) => !user.studies.includes(this.studyName));
      this.filteredUsers = this.createUsersFilterObservable(usersOutsideStudy);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
    this.form.enable();
  }

  private createUsersFilterObservable(
    users: ProfessionalAccount[]
  ): Observable<ProfessionalAccount[]> {
    return this.usernameFilterCtrl.valueChanges.pipe(
      startWith(this.usernameFilterCtrl.value as string),
      map((filterValue) => filterValue.toLowerCase()),
      map((filterValue) => {
        if (!filterValue) {
          return users;
        } else {
          return users.filter((user) =>
            user.username.toLowerCase().includes(filterValue)
          );
        }
      }),
      shareReplay(1)
    );
  }
}

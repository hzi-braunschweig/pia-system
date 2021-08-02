/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { PersonalDataService } from 'src/app/psa.app.core/providers/personaldata-service/personaldata-service';
import { UserWithSameRole } from '../psa.app.core/models/user';
import { AlertService } from '../_services/alert.service';
import { ReplaySubject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export type DeletionType = 'general' | 'personal' | 'study' | 'sample';
export type DeletionAction = 'requested' | 'rejected' | 'confirmed';

export interface DialogDeletePartnerData {
  pendingdeletionId?: string;
  usernames: {
    usernameSysAdmin?: string;
    usernamePM?: string;
    studyName?: string;
    sampleId?: string;
    usernameProband?: string;
  };
  type: DeletionType;
}

export interface DialogDeletePartnerResult {
  action: DeletionAction;
  success: boolean;
  deletedId?: string;
  requestedFor?: string;
}

@Component({
  selector: 'dialog-delete-partner',
  template: `
    <mat-dialog-content style="	text-align: left">
      <app-loading-spinner *ngIf="isLoading"></app-loading-spinner>
      <div *ngIf="form">
        <form [formGroup]="form">
          <mat-grid-list
            *ngIf="!acceptDelete && !isLoading"
            [cols]="1"
            rowHeight="120px"
          >
            <mat-grid-tile>
              <div
                *ngIf="
                  data.usernames &&
                  data.usernames.usernameProband &&
                  data.type === 'general'
                "
              >
                {{
                  'DIALOG.DELETE_PARTNER_PROBAND'
                    | translate
                      : { usernameProband: data.usernames.usernameProband }
                }}
              </div>
              <div
                *ngIf="
                  data.usernames &&
                  data.usernames.usernameProband &&
                  data.type === 'personal'
                "
              >
                {{
                  'DIALOG.DELETE_PARTNER_PROBAND_CONTACT'
                    | translate
                      : { usernameProband: data.usernames.usernameProband }
                }}
              </div>
              <div *ngIf="data.usernames && data.usernames.sampleId">
                {{
                  'DIALOG.DELETE_PARTNER_SAMPLE'
                    | translate: { sampleId: data.usernames.sampleId }
                }}
              </div>
              <div *ngIf="data.usernames && data.usernames.studyName">
                {{
                  'DIALOG.DELETE_PARTNER_STUDY'
                    | translate: { studyName: data.usernames.studyName }
                }}
              </div>
            </mat-grid-tile>
            <mat-grid-tile>
              <mat-form-field fxFlex style="margin:25px">
                <mat-select
                  id="selectuser"
                  placeholder="{{ 'DIALOG.USER_SAME_ROLE' | translate }}"
                  formControlName="user_for_approve"
                >
                  <mat-select-search
                    [formControl]="usernameFilterCtrl"
                  ></mat-select-search>
                  <mat-option
                    *ngFor="let user of filteredUsers | async"
                    [value]="user"
                  >
                    {{ user.username }}
                  </mat-option>
                </mat-select>
                <mat-error
                  *ngIf="form.controls['user_for_approve'].hasError('required')"
                  >{{ 'DIALOG.ADMIN_REQUIRED' | translate }}</mat-error
                >
              </mat-form-field>
            </mat-grid-tile>
          </mat-grid-list>
        </form>
      </div>
      <div *ngIf="!isLoading">
        <div
          *ngIf="
            acceptDelete &&
            data.usernames.usernameProband &&
            data.type === 'general'
          "
        >
          {{
            'DIALOG.ACCEPT_DELETE_PARTNER_PROBAND' | translate: data.usernames
          }}
        </div>
        <div
          *ngIf="
            acceptDelete &&
            data.usernames.usernameProband &&
            data.type === 'personal'
          "
        >
          {{
            'DIALOG.ACCEPT_DELETE_PARTNER_PROBAND_CONTACT'
              | translate: data.usernames
          }}
        </div>
        <div *ngIf="acceptDelete && data.usernames.studyName">
          {{ 'DIALOG.ACCEPT_DELETE_PARTNER_STUDY' | translate: data.usernames }}
        </div>
        <div *ngIf="acceptDelete && data.usernames.sampleId">
          {{
            'DIALOG.ACCEPT_DELETE_PARTNER_SAMPLE' | translate: data.usernames
          }}
        </div>
      </div>
      <span *ngIf="isLoading"> {{ 'DIALOG.PLEASE_WAIT' | translate }} </span>
    </mat-dialog-content>
    <hr />
    <mat-dialog-actions align="end" *ngIf="!isLoading">
      <button mat-button type="button" (click)="onCancelClick()">
        {{ 'DIALOG.CANCEL' | translate }}
      </button>
      <button
        mat-raised-button
        style="background-color: red"
        *ngIf="acceptDelete"
        type="button"
        (click)="onNoClick()"
      >
        {{ 'DIALOG.REFUSE' | translate }}
      </button>
      <button
        [disabled]="form && !form.valid"
        id="confirmbutton"
        mat-raised-button
        color="primary"
        (click)="onConfirmClick(form)"
      >
        {{ 'DIALOG.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogDeletePartnerComponent implements OnInit {
  usersWithSameRole: UserWithSameRole[];
  form: FormGroup;
  acceptDelete: boolean = false;
  public usernameFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<UserWithSameRole[]> = new ReplaySubject<
    UserWithSameRole[]
  >(1);
  isLoading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<
      DialogDeletePartnerComponent,
      DialogDeletePartnerResult
    >,
    private authService: AuthService,
    private personalDataService: PersonalDataService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: DialogDeletePartnerData
  ) {
    dialogRef.disableClose = true;
    if (
      data.usernames &&
      (data.usernames.usernamePM || data.usernames.usernameSysAdmin)
    ) {
      this.acceptDelete = true;
    } else {
      this.authService
        .getUsersWithSameRole()
        .then((result: { users: UserWithSameRole[] }) => {
          this.usersWithSameRole = result.users;
          this.filteredUsers.next(
            this.usersWithSameRole.filter((user) => {
              // use validator to filter users without email address
              const control = new FormControl(user.username, Validators.email);
              return !control.errors || !control.errors.email;
            })
          );
        })
        .catch((err: HttpErrorResponse) => {
          this.alertService.errorObject(err);
        });
    }
  }

  ngOnInit(): void {
    if (!this.acceptDelete) {
      this.form = new FormGroup({
        user_for_approve: new FormControl(null, Validators.required),
      });
      // listen for search field value changes
      this.usernameFilterCtrl.valueChanges.subscribe(() => {
        this.filterUsers();
      });
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  async onNoClick(): Promise<void> {
    if (!this.acceptDelete) {
      this.dialogRef.close();
      return;
    }
    const probandUsername = this.data.usernames
      ? this.data.usernames.usernameProband
      : null;
    const dialogResult: DialogDeletePartnerResult = {
      action: 'rejected',
      success: undefined,
      deletedId: undefined,
    };
    try {
      switch (this.data.type) {
        case 'personal':
          dialogResult.deletedId = probandUsername;
          await this.personalDataService.deletePendingDeletion(probandUsername);
          break;
        case 'general':
          // if the proband manager did not confirm deletion we create delete request
          // to userService with pending deletion id
          dialogResult.deletedId = probandUsername;
          await this.authService.deletePendingDeletion(
            this.data.pendingdeletionId
          );
          await this.personalDataService.deletePendingDeletion(probandUsername);
          break;
        case 'study':
        case 'sample':
          // if the system manager did not confirm deletion we create delete request
          // to userService with pending deletion id
          dialogResult.deletedId =
            this.data.type === 'study'
              ? this.data.usernames.studyName
              : this.data.usernames.sampleId;
          await this.authService.deletePendingDeletion(
            this.data.pendingdeletionId
          );
          break;
      }
      dialogResult.success = true;
      this.dialogRef.close(dialogResult);
    } catch (err) {
      dialogResult.success = false;
      this.dialogRef.close(dialogResult);
    }
  }

  private filterUsers(): void {
    this.filteredUsers.next(this.usersWithSameRole);
    if (!this.usersWithSameRole) {
      return;
    }
    // get the search keyword
    let search = this.usernameFilterCtrl.value;
    if (!search) {
      this.filteredUsers.next(this.usersWithSameRole.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the users
    this.filteredUsers.next(
      this.usersWithSameRole.filter((user) =>
        user.username.toLowerCase().includes(search)
      )
    );
  }

  async onConfirmClick(form?: FormGroup): Promise<void> {
    this.isLoading = true;

    const probandUsername = this.data.usernames
      ? this.data.usernames.usernameProband
      : null;
    const requestData = {
      requested_for: form ? form.value.user_for_approve.username : null,
      type: this.data.usernames.sampleId
        ? 'sample'
        : this.data.usernames.studyName
        ? 'study'
        : 'proband',
      for_id: this.data.usernames.sampleId
        ? this.data.usernames.sampleId
        : this.data.usernames.studyName
        ? this.data.usernames.studyName
        : probandUsername,
    };

    if (!this.acceptDelete) {
      const dialogResult: DialogDeletePartnerResult = {
        action: 'requested',
        success: undefined,
        deletedId: requestData.for_id,
        requestedFor: form ? form.value.user_for_approve.username : null,
      };
      try {
        switch (this.data.type) {
          case 'personal':
            // if the proband manager asked for deletion, we create
            // a new pending deletion in iPia
            await this.personalDataService.postPendingDeletion({
              requested_for: form ? form.value.user_for_approve.username : null,
              proband_id: probandUsername,
            });
            break;
          case 'general':
            // if the proband manager asked for deletion, we create a new pending deletion
            await this.authService.postPendingDeletion(requestData);
            break;
          case 'study':
          case 'sample':
            // if the proband manager asked for deletion, we create a new pending deletion in qPia
            dialogResult.deletedId =
              this.data.type === 'study'
                ? this.data.usernames.studyName
                : this.data.usernames.sampleId;
            await this.authService.postPendingDeletion(requestData);
            break;
        }
        dialogResult.success = true;
        this.dialogRef.close(dialogResult);
      } catch (err) {
        dialogResult.success = false;
        this.dialogRef.close(dialogResult);
      }
    } else {
      const dialogResult: DialogDeletePartnerResult = {
        action: 'confirmed',
        success: undefined,
        deletedId: undefined,
        requestedFor: form ? form.value.user_for_approve.username : null,
      };
      try {
        switch (this.data.type) {
          case 'personal':
            // if the proband manager confirmed deletion, we send put request to personal data service to delete a proband
            dialogResult.deletedId = probandUsername;
            await this.personalDataService.putPendingDeletion(probandUsername);
            break;
          case 'general':
            dialogResult.deletedId = probandUsername;
            // if the proband manager confirmed deletion we create put request
            // to userService with pending deletion id to execute the deletion
            await this.authService.putPendingDeletion(
              this.data.pendingdeletionId
            );
            break;
          case 'study':
          case 'sample':
            // if the system administrator confirmed deletion we create put request
            // to userService with pending deletion id
            await this.authService.putPendingDeletion(
              this.data.pendingdeletionId
            );
            break;
        }
        dialogResult.success = true;
        this.dialogRef.close(dialogResult);
      } catch (err) {
        dialogResult.success = false;
        this.dialogRef.close(dialogResult);
      }
    }
  }
}

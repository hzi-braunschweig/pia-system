/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { ReplaySubject } from 'rxjs';
import { AlertService } from '../_services/alert.service';
import { UserService } from '../psa.app.core/providers/user-service/user.service';
import { DialogChangeComplianceData } from '../pages/probands/probands-personal-info/probands-personal-info.component';
import { ProfessionalAccount } from '../psa.app.core/models/professionalAccount';

@Component({
  selector: 'dialog-change-compliance',
  template: `
    <style>
      .readOnly {
        pointer-events: none;
      }
    </style>
    <div *ngIf="form">
      <form [formGroup]="form" (ngSubmit)="confirmSelection(form)">
        <div [class.readOnly]="data.requested_by">
          <mat-grid-list [cols]="1" rowHeight="2rem">
            <mat-grid-tile [rowspan]="1">
              <mat-checkbox
                fxFlex
                fxLayoutAlign="start center"
                formControlName="compliance_labresults_to"
                >{{ 'PROBAND.COMPLIANCE_LABRESULTS' | translate }}
              </mat-checkbox>
            </mat-grid-tile>
            <mat-grid-tile [rowspan]="1">
              <mat-checkbox
                fxFlex
                fxLayoutAlign="start center"
                formControlName="compliance_samples_to"
                >{{ 'PROBAND.COMPLIANCE_SAMPLES' | translate }}
              </mat-checkbox>
            </mat-grid-tile>
            <mat-grid-tile [rowspan]="1">
              <mat-checkbox
                fxFlex
                fxLayoutAlign="start center"
                formControlName="compliance_bloodsamples_to"
                >{{ 'PROBAND.COMPLIANCE_BLOODSAMPLES' | translate }}
              </mat-checkbox>
            </mat-grid-tile>
          </mat-grid-list>
          <mat-grid-list [cols]="1" rowHeight="80px">
            <mat-grid-tile
              *ngIf="!data.requested_by && data.has_four_eyes_opposition"
            >
              <mat-form-field fxFlex>
                <mat-select
                  id="selectuser"
                  placeholder="{{ 'DIALOG.USER_SAME_ROLE' | translate }}"
                  formControlName="requested_for"
                >
                  <mat-select-search
                    [formControl]="usernameFilterCtrl"
                  ></mat-select-search>
                  <mat-option
                    *ngFor="let user of filteredUsers | async"
                    [value]="user.username"
                  >
                    {{ user.username }}
                  </mat-option>
                </mat-select>
                <mat-error
                  *ngIf="form.controls['requested_for'].hasError('required')"
                  >{{ 'DIALOG.PM_REQUIRED' | translate }}</mat-error
                >
              </mat-form-field>
            </mat-grid-tile>
          </mat-grid-list>
        </div>
      </form>
    </div>
    <mat-dialog-content style="	text-align: left">
      <div
        *ngIf="!data.requested_by && data.has_four_eyes_opposition"
        style="margin:25px"
      >
        {{
          'DIALOG.CHANGE_COMPLIANCE_PARTNER'
            | translate: { usernameProband: data.usernameProband }
        }}
      </div>
      <div *ngIf="data.requested_by" style="margin:25px">
        {{ 'DIALOG.ACCEPT_CHANGE_COMPLIANCE' | translate: usernames }}
      </div>
    </mat-dialog-content>
    <hr />
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancelClick()">
        {{ 'DIALOG.CANCEL' | translate }}
      </button>
      <button
        mat-raised-button
        style="background-color: red"
        *ngIf="data.requested_by"
        (click)="onNoClick()"
      >
        {{ 'DIALOG.REFUSE' | translate }}
      </button>
      <button
        [disabled]="form && !form.valid"
        id="confirmbutton"
        mat-raised-button
        color="primary"
        (click)="confirmSelection(form)"
      >
        {{ 'DIALOG.CONFIRM' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogChangeComplianceComponent implements OnInit {
  public form: FormGroup;
  public usernameFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<ProfessionalAccount[]> =
    new ReplaySubject(1);
  public usernames = { usernameProband: '', usernamePM: '' };

  private usersWithSameRole: ProfessionalAccount[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogChangeComplianceData,
    private dialogRef: MatDialogRef<DialogChangeComplianceComponent>,
    private alertService: AlertService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.usernames.usernameProband = data.usernameProband;
    this.usernames.usernamePM = data.requested_by;
  }

  public ngOnInit(): void {
    if (!this.data.requested_by && this.data.has_four_eyes_opposition) {
      this.userService
        .getProfessionalAccounts({
          studyName: this.data.studyName,
          onlyMailAddresses: true,
          filterSelf: true,
        })
        .then((users) => {
          this.usersWithSameRole = users;
          this.filteredUsers.next(this.usersWithSameRole);
        })
        .catch((err) => {
          this.alertService.errorObject(err);
        });

      this.form = new FormGroup({
        requested_for: new FormControl(null, Validators.required),
        compliance_labresults_to: new FormControl(
          this.data.compliance_labresults,
          Validators.required
        ),
        compliance_samples_to: new FormControl(
          this.data.compliance_samples,
          Validators.required
        ),
        compliance_bloodsamples_to: new FormControl(
          this.data.compliance_bloodsamples,
          Validators.required
        ),
      });

      // listen for search field value changes
      this.usernameFilterCtrl.valueChanges.subscribe(() => {
        this.filterUsers();
      });
    } else {
      this.form = new FormGroup({
        compliance_labresults_to: new FormControl(
          this.data.compliance_labresults,
          Validators.required
        ),
        compliance_samples_to: new FormControl(
          this.data.compliance_samples,
          Validators.required
        ),
        compliance_bloodsamples_to: new FormControl(
          this.data.compliance_bloodsamples,
          Validators.required
        ),
      });
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onNoClick(): void {
    const dialogResult = [];
    dialogResult.push({
      acceptDelete: this.data.requested_by ? true : false,
      changingRejected: true,
    });
    if (this.data.requested_by) {
      this.authService
        .deletePendingComplianceChange(
          this.data.deletePendingComplianceChangeId
        )
        .then(
          (result: any) => {
            dialogResult.push(result);
            this.dialogRef.close(dialogResult);
          },
          (err: any) => {
            this.dialogRef.close(err);
          }
        );
    } else {
      this.dialogRef.close();
    }
  }

  confirmSelection(form): void {
    const dialogResult = [];
    dialogResult.push({
      acceptDelete: this.data.requested_by ? true : false,
      changingRejected: false,
    });
    if (!this.data.requested_by || !this.data.has_four_eyes_opposition) {
      form.value.proband_id = this.data.usernameProband;

      if (!this.data.has_four_eyes_opposition) {
        form.value.requested_for = this.data.requested_for;
      }

      this.authService.postPendingComplianceChange(this.form.value).then(
        (result: any) => {
          dialogResult.push(result);
          this.dialogRef.close(dialogResult);
        },
        (err: any) => {
          this.dialogRef.close(err);
        }
      );
    } else {
      this.authService
        .putPendingComplianceChange(
          this.data.deletePendingComplianceChangeId.toString()
        )
        .then(
          (result: any) => {
            dialogResult.push(result);
            this.dialogRef.close(dialogResult);
          },
          (err: any) => {
            this.dialogRef.close(err);
          }
        );
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
      this.usersWithSameRole.filter(
        (user) => user.username.toLowerCase().indexOf(search) > -1
      )
    );
  }
}

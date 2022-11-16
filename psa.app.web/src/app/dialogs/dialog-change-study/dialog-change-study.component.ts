/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReplaySubject } from 'rxjs';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { ProfessionalAccount } from '../../psa.app.core/models/professionalAccount';
import { Study } from '../../psa.app.core/models/study';

export interface DialogChangeStudyData {
  study: Study;
}

@Component({
  selector: 'app-dialog-change-study',
  templateUrl: 'dialog-change-study.component.html',
  styleUrls: ['dialog-change-study.component.scss'],
})
export class DialogChangeStudyComponent implements OnInit {
  public form: FormGroup;
  public usernameFilterCtrl: FormControl = new FormControl();
  public filteredUsers: ReplaySubject<ProfessionalAccount[]> =
    new ReplaySubject(1);

  private usersWithSameRole: ProfessionalAccount[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogChangeStudyData,
    private dialogRef: MatDialogRef<DialogChangeStudyComponent>,
    private alertService: AlertService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  public ngOnInit(): void {
    // New change request
    if (!this.data.study.pendingStudyChange) {
      this.userService
        .getProfessionalAccounts({
          studyName: this.data.study.name,
          onlyMailAddresses: true,
          filterSelf: true,
          accessLevel: 'admin',
        })
        .then((users) => {
          // Filter users that have admin access to study and a valid email as username
          this.usersWithSameRole = users;
          this.filteredUsers.next(this.usersWithSameRole);
        })
        .catch((err) => {
          this.alertService.errorObject(err);
        });

      // Listen for search field value changes
      this.usernameFilterCtrl.valueChanges.subscribe(() => {
        this.filterUsers();
      });
    }
    this.initForm(this.data.study.pendingStudyChange !== null);
  }

  initForm(isChangeConfirmation: boolean): void {
    this.form = new FormGroup({
      description_to: new FormControl(this.data.study.description),
      has_rna_samples_to: new FormControl(this.data.study.has_rna_samples),
      sample_prefix_to: new FormControl(this.data.study.sample_prefix),
      sample_suffix_length_to: new FormControl(
        this.data.study.sample_suffix_length
      ),
      pseudonym_prefix_to: new FormControl(this.data.study.pseudonym_prefix),
      pseudonym_suffix_length_to: new FormControl(
        this.data.study.pseudonym_suffix_length
      ),
      has_answers_notify_feature_to: new FormControl(
        this.data.study.has_answers_notify_feature
      ),
      has_answers_notify_feature_by_mail_to: new FormControl(
        this.data.study.has_answers_notify_feature_by_mail
      ),
      has_four_eyes_opposition_to: new FormControl(
        this.data.study.has_four_eyes_opposition
      ),
      has_partial_opposition_to: new FormControl(
        this.data.study.has_partial_opposition
      ),
      has_total_opposition_to: new FormControl(
        this.data.study.has_total_opposition
      ),
      has_compliance_opposition_to: new FormControl(
        this.data.study.has_compliance_opposition
      ),
      has_logging_opt_in_to: new FormControl(
        this.data.study.has_logging_opt_in
      ),
      requested_for: new FormControl(null, Validators.required),
    });
    if (isChangeConfirmation) {
      this.form.controls['description_to'].disable();
      this.form.controls['has_rna_samples_to'].disable();
      this.form.controls['sample_prefix_to'].disable();
      this.form.controls['sample_suffix_length_to'].disable();
      this.form.controls['pseudonym_prefix_to'].disable();
      this.form.controls['pseudonym_suffix_length_to'].disable();
      this.form.controls['has_answers_notify_feature_to'].disable();
      this.form.controls['has_answers_notify_feature_by_mail_to'].disable();
      this.form.controls['has_four_eyes_opposition_to'].disable();
      this.form.controls['has_partial_opposition_to'].disable();
      this.form.controls['has_total_opposition_to'].disable();
      this.form.controls['has_compliance_opposition_to'].disable();
      this.form.controls['has_logging_opt_in_to'].disable();
      this.form.removeControl('requested_for');
    }
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onNoClick(): void {
    const dialogResult = 'rejected';
    this.authService
      .deletePendingStudyChange(this.data.study.pendingStudyChange.id)
      .then(
        () => {
          this.dialogRef.close(dialogResult);
        },
        (err: any) => {
          this.dialogRef.close(err);
        }
      );
  }

  confirmSelection(form): void {
    if (!this.data.study.pendingStudyChange) {
      form.value.study_id = this.data.study.name;
      this.authService.postPendingStudyChange(this.form.value).then(
        () => {
          const dialogResult = 'requested';
          this.dialogRef.close(dialogResult);
        },
        (err: any) => {
          this.dialogRef.close(err);
        }
      );
    } else {
      this.authService
        .putPendingStudyChange(this.data.study.pendingStudyChange.id)
        .then(
          () => {
            const dialogResult = 'accepted';
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
    let search = this.usernameFilterCtrl.value;
    if (!search) {
      this.filteredUsers.next(this.usersWithSameRole.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredUsers.next(
      this.usersWithSameRole.filter(
        (user) => user.username.toLowerCase().indexOf(search) > -1
      )
    );
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../psa.app.core/providers/user-service/user.service';
import { Study } from '../../psa.app.core/models/study';
import { AlertService } from '../../_services/alert.service';
import { CurrentUser } from '../../_services/current-user.service';
import {
  maxAllowedAccountsCountLimit,
  requireMaxAllowedAccountsCountForOpenSelfRegistration,
} from './study-form-validators';

@Component({
  selector: 'app-study-dialog',
  templateUrl: 'study-dialog.html',
  styleUrls: ['study-dialog.scss'],
})
export class DialogStudyComponent implements OnInit {
  public form: FormGroup;

  public get isEditMode(): boolean {
    return Boolean(this.existingStudy.name);
  }

  constructor(
    public dialogRef: MatDialogRef<DialogStudyComponent>,
    @Inject(MAT_DIALOG_DATA)
    private existingStudy: { name?: string },
    private alertService: AlertService,
    private userService: UserService,
    private user: CurrentUser
  ) {}

  private static createEmptyStudy(): Study {
    return {
      name: null,
      description: null,
      has_open_self_registration: false,
      max_allowed_accounts_count: null,
      pm_email: null,
      hub_email: null,
      status: 'active',
      has_rna_samples: false,
      sample_prefix: '',
      sample_suffix_length: null,
      pseudonym_prefix: '',
      pseudonym_suffix_length: null,
      has_answers_notify_feature: false,
      has_answers_notify_feature_by_mail: false,
      has_four_eyes_opposition: false,
      has_partial_opposition: false,
      has_total_opposition: false,
      has_compliance_opposition: false,
      has_logging_opt_in: false,
      has_required_totp: true,
      pendingStudyChange: null,
    };
  }

  public async ngOnInit(): Promise<void> {
    try {
      if (this.isEditMode) {
        const study = await this.userService.getStudy(this.existingStudy.name);
        this.initForm(study);
      } else {
        this.initForm(DialogStudyComponent.createEmptyStudy());
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  public async submit(): Promise<void> {
    this.form.get('name').enable();
    const study = this.form.value;
    study.pm_email = study.pm_email ?? null;
    study.hub_email = study.hub_email ?? null;
    study.has_rna_samples = study.has_rna_samples ?? false;
    study.sample_prefix = study.sample_prefix ?? '';
    study.sample_suffix_length = study.sample_suffix_length ?? null;
    study.pseudonym_prefix = study.pseudonym_prefix ?? '';
    study.pseudonym_suffix_length = study.pseudonym_suffix_length ?? null;
    study.has_required_totp = study.has_required_totp ?? true;
    study.max_allowed_accounts_count = study.has_open_self_registration
      ? study.max_allowed_accounts_count
      : null;

    try {
      let result: Study;
      if (this.isEditMode) {
        result = await this.userService.putStudy(study.name, study);
      } else {
        result = await this.userService.postStudy(study);
        this.existingStudy.name = result.name;
      }
      this.initForm(result);
      this.dialogRef.close(`${this.form.value}`);
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  private initForm(study: Study): void {
    this.form = new FormGroup(
      {
        name: new FormControl(study.name, Validators.required),
        description: new FormControl(study.description, Validators.required),
        has_open_self_registration: new FormControl(
          study.has_open_self_registration
        ),
        max_allowed_accounts_count: new FormControl(
          study.max_allowed_accounts_count,
          Validators.min(
            Math.max(
              study.accounts_count ?? 0,
              study.max_allowed_accounts_count ?? 0
            )
          )
        ),
        pm_email: new FormControl(study.pm_email, Validators.email),
        hub_email: new FormControl(study.hub_email, Validators.email),
        has_rna_samples: new FormControl(
          study.has_rna_samples,
          Validators.required
        ),
        has_required_totp: new FormControl(study.has_required_totp),
        sample_prefix: new FormControl(study.sample_prefix),
        sample_suffix_length: new FormControl(study.sample_suffix_length),
        pseudonym_prefix: new FormControl(study.pseudonym_prefix),
        pseudonym_suffix_length: new FormControl(study.pseudonym_suffix_length),
      },
      {
        validators: [
          requireMaxAllowedAccountsCountForOpenSelfRegistration,
          maxAllowedAccountsCountLimit,
        ],
      }
    );

    if (this.isEditMode) {
      this.form.get('name').disable();
    }
    if (this.user.hasRole('Forscher')) {
      this.form.get('pm_email').disable();
      this.form.get('hub_email').disable();
      this.form.get('has_required_totp').disable();
      this.form.get('has_open_self_registration').disable();
      this.form.get('max_allowed_accounts_count').disable();
    } else if (this.user.hasRole('SysAdmin')) {
      this.form.get('has_rna_samples').disable();
      this.form.get('sample_prefix').disable();
      this.form.get('sample_suffix_length').disable();
      this.form.get('pseudonym_prefix').disable();
      this.form.get('pseudonym_suffix_length').disable();
    }
  }
}

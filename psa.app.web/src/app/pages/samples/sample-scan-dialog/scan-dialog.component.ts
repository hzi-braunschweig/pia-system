/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Study } from '../../../psa.app.core/models/study';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface ScanDialogData {
  isBloodSample: boolean;
  study: Study;
}

export interface ScanDialogResult {
  sample_id: string;
  dummy_sample_id?: string;
}

@Component({
  selector: 'app-sample-scan-dialog',
  templateUrl: 'scan-dialog.component.html',
})
export class ScanDialogComponent {
  public readonly study: Study = this.data.study;
  public readonly isBloodSample = this.data.isBloodSample;

  public readonly scanForm: FormGroup = this.createScanForm();

  constructor(@Inject(MAT_DIALOG_DATA) private data: ScanDialogData) {}

  private static validateSampleId(
    prefix?: string,
    suffixLength?: number
  ): ValidatorFn {
    const regexp = new RegExp(
      (prefix ? '^' + prefix + '-' : '.*') +
        (suffixLength ? '[0-9]{' + suffixLength + '}$' : '[0-9]*$'),
      'i'
    );
    return (control: AbstractControl): { sampleWrongFormat: boolean } => {
      if (!control.value || !regexp.test(control.value)) {
        return { sampleWrongFormat: true };
      } else {
        return null;
      }
    };
  }

  public hasDummySampleId(): boolean {
    return !this.isBloodSample && this.study.has_rna_samples;
  }

  public getScanResult(): ScanDialogResult {
    return {
      sample_id: this.scanForm.get('sample_id').value,
      dummy_sample_id: this.scanForm.get('dummy_sample_id').value || undefined,
    };
  }

  private createScanForm(): FormGroup {
    return new FormGroup({
      sample_id: new FormControl('', [
        Validators.required,
        ScanDialogComponent.validateSampleId(
          this.study.sample_prefix,
          this.study.sample_suffix_length
        ),
      ]),
      dummy_sample_id: new FormControl(
        { value: '', disabled: !this.hasDummySampleId() },
        [
          Validators.required,
          ScanDialogComponent.validateSampleId(
            this.study.sample_prefix,
            this.study.sample_suffix_length
          ),
        ]
      ),
    });
  }
}

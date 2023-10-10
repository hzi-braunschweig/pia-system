/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { AlertService } from '../../../_services/alert.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
} from '../../../psa.app.core/models/compliance';
import { Component, DoCheck } from '@angular/core';
import { ComplianceForStudyWrapper } from './complianceForStudyWrapper';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';

@Component({ template: '' })
export abstract class ComplianceEditParentComponent implements DoCheck {
  public study: string;

  public studyWrapper: ComplianceForStudyWrapper;

  protected constructor(
    protected complianceService: ComplianceService,
    protected alertService: AlertService,
    protected dialog: MatDialog
  ) {}

  public async onSubmit(
    studyWrapper: ComplianceForStudyWrapper
  ): Promise<void> {
    studyWrapper.cleanFormControls();
    studyWrapper.form.markAllAsTouched();
    if (studyWrapper.form.valid) {
      const formComplianceData =
        studyWrapper.extractNewComplianceDataFromForm();
      try {
        const newComplianceData = await this.updateComplianceAgreement(
          formComplianceData
        );
        studyWrapper.setComplianceData(newComplianceData);
        this.dialog.open(DialogPopUpComponent, {
          width: '300px',
          data: {
            content: 'COMPLIANCE.SAVED_SUCCESSFULLY',
            isSuccess: true,
          },
        });
      } catch (err) {
        if (err.status === 422) {
          this.alertService.errorMessage(
            'COMPLIANCE.NEED_CONSENT_TO_APP_USAGE'
          );
        } else {
          this.alertService.errorObject(err);
        }
        throw new Error('Could not update compliance.');
      }
    } else {
      throw new Error('Invalid FormData. Could not update compliance.');
    }
  }

  protected abstract updateComplianceAgreement(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse>;

  protected async prepareComplianceForm(
    complianceData: ComplianceDataResponse
  ): Promise<void> {
    // Create a wrapper for each study
    this.studyWrapper = new ComplianceForStudyWrapper(this.study);
    this.studyWrapper.setComplianceData(complianceData);

    // if compliance does not exist, get the compliance text
    if (!complianceData) {
      const text = await this.complianceService.getComplianceText(this.study);
      // check if a text object was returned. If not, no compliance can or must be filled
      if (text) {
        this.studyWrapper.complianceTextObject = text.compliance_text_object;
        this.studyWrapper.complianceText = text.compliance_text;
      }
    }
  }

  public ngDoCheck(): void {
    if (this.studyWrapper) {
      if (!this.studyWrapper.editMode) {
        this.studyWrapper.form.disable();
      }
    }
  }
}

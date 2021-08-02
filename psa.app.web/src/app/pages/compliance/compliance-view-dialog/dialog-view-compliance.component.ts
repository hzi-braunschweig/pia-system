/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';
import { AlertService } from '../../../_services/alert.service';
import { ComplianceWrapper } from './complianceWrapper';
import { ComplianceDataResponse } from '../../../psa.app.core/models/compliance';

@Component({
  selector: 'app-dialog-view-compliance',
  templateUrl: './dialog-view-compliance.component.html',
  styleUrls: ['./dialog-view-compliance.component.scss'],
})
export class DialogViewComplianceComponent implements OnInit {
  isLoading: boolean = false;
  complianceWrapper: ComplianceWrapper;
  complianceData: ComplianceDataResponse;

  constructor(
    private complianceService: ComplianceService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public readonly dialogData: any,
    public readonly dialogRef: MatDialogRef<DialogViewComplianceComponent>
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      this.complianceWrapper = new ComplianceWrapper();
      this.complianceData =
        await this.complianceService.getComplianceAgreementById(
          this.dialogData.study,
          this.dialogData.complianceId
        );
      this.complianceWrapper.setComplianceData(this.complianceData);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  async downloadPdf(): Promise<void> {
    await this.complianceService.getComplianceAgreementPdfById(
      this.dialogData.study,
      this.dialogData.complianceId
    );
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceManager } from '../../../../_services/compliance-manager.service';
import { AlertService } from '../../../../_services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
} from '../../../../psa.app.core/models/compliance';
import { AuthenticationManager } from '../../../../_services/authentication-manager.service';
import { ComplianceEditParentComponent } from '../compliance-edit-parent.component';

@Component({
  selector: 'app-compliance-edit-proband',
  templateUrl: './compliance-edit-proband.component.html',
  styleUrls: ['./compliance-edit-proband.component.scss'],
})
export class ComplianceEditProbandComponent
  extends ComplianceEditParentComponent
  implements OnInit
{
  @Input()
  username: string;

  @Input()
  study: string;

  isLoading = false;

  constructor(
    private auth: AuthenticationManager,
    private complianceManager: ComplianceManager,
    protected complianceService: ComplianceService,
    protected alertService: AlertService,
    protected dialog: MatDialog
  ) {
    super(complianceService, alertService, dialog);
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      // get the current compliance data
      const data =
        await this.complianceManager.getComplianceAgreementForCurrentUser(
          this.study
        );

      await this.prepareComplianceForm(data);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  async updateComplianceAgreement(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    return await this.complianceManager.updateComplianceAgreementForCurrentUser(
      complianceData,
      this.study
    );
  }

  async downloadPdf(studyName: string): Promise<void> {
    await this.complianceService.getComplianceAgreementPdfForUser(
      studyName,
      this.username
    );
  }
}

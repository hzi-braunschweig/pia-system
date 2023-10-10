/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceManager } from '../../../../_services/compliance-manager.service';
import { AlertService } from '../../../../_services/alert.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
} from '../../../../psa.app.core/models/compliance';
import { ComplianceEditParentComponent } from '../compliance-edit-parent.component';
import { CurrentUser } from '../../../../_services/current-user.service';
import { Router } from '@angular/router';
import { ComplianceForStudyWrapper } from '../complianceForStudyWrapper';

@Component({
  selector: 'app-compliance-edit-proband',
  templateUrl: './compliance-edit-proband.component.html',
  styleUrls: ['./compliance-edit-proband.component.scss'],
})
export class ComplianceEditProbandComponent
  extends ComplianceEditParentComponent
  implements OnInit
{
  public isLoading = false;

  constructor(
    private user: CurrentUser,
    private complianceManager: ComplianceManager,
    protected complianceService: ComplianceService,
    protected alertService: AlertService,
    protected dialog: MatDialog,
    protected router: Router
  ) {
    super(complianceService, alertService, dialog);
    this.study = this.user.study;
  }

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      // get the current compliance data
      const data =
        await this.complianceManager.getComplianceAgreementForCurrentUser();

      await this.prepareComplianceForm(data);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  public override async onSubmit(
    studyWrapper: ComplianceForStudyWrapper
  ): Promise<void> {
    try {
      await super.onSubmit(studyWrapper);
      await this.router.navigate(['home']);
    } catch (e) {
      console.log(e.message);
    }
  }

  protected async updateComplianceAgreement(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    return await this.complianceManager.updateComplianceAgreementForCurrentUser(
      complianceData
    );
  }

  public downloadPdf(): void {
    this.complianceService.getComplianceAgreementPdfForProband(
      this.user.study,
      this.user.username
    );
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { AlertService } from '../../../../_services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
} from '../../../../psa.app.core/models/compliance';
import { ComplianceEditParentComponent } from '../compliance-edit-parent.component';

@Component({
  selector: 'app-compliance-edit-examiner',
  templateUrl: './compliance-edit-examiner.component.html',
  styleUrls: ['./compliance-edit-examiner.component.scss'],
})
export class ComplianceEditExaminerComponent
  extends ComplianceEditParentComponent
  implements OnInit
{
  constructor(
    protected complianceService: ComplianceService,
    protected alertService: AlertService,
    protected dialog: MatDialog
  ) {
    super(complianceService, alertService, dialog);
  }
  @Input()
  username: string;

  @Input()
  study: string;

  isLoading = false;

  isComplianceNeeded = true;

  private static hasComplianceText(
    data: ComplianceDataResponse | null
  ): boolean {
    return data?.compliance_text_object?.length > 0;
  }

  private static isAlreadyFilled(data: ComplianceDataResponse | null): boolean {
    return (
      data &&
      (data.textfields === null ||
        data.compliance_system === null ||
        data.compliance_questionnaire === null)
    );
  }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      // get the current compliance data
      const data = await this.complianceService.getComplianceAgreementForUser(
        this.study,
        this.username
      );
      if (data && !ComplianceEditExaminerComponent.hasComplianceText(data)) {
        this.isComplianceNeeded = false;
      } else if (!ComplianceEditExaminerComponent.isAlreadyFilled(data)) {
        await this.prepareComplianceForm(data);
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  async updateComplianceAgreement(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    return this.complianceService.createComplianceAgreementForUser(
      this.study,
      this.username,
      complianceData
    );
  }
}

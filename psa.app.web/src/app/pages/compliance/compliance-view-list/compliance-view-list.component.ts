import { Component, Input } from '@angular/core';
import {
  ComplianceData,
  QuestionnairCompliance,
} from '../../../psa.app.core/models/compliance';

@Component({
  selector: 'app-compliance-view-list',
  templateUrl: './compliance-view-list.component.html',
})
export class ComplianceViewListComponent {
  @Input()
  compliance: ComplianceData;

  getBooleanQuestionnaireCompliances(): QuestionnairCompliance[] {
    return this.compliance.compliance_questionnaire.filter(
      (compliance) => typeof compliance.value === 'boolean'
    );
  }
}

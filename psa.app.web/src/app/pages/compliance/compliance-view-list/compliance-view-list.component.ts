/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import {
  ComplianceData,
  QuestionnairCompliance,
} from '../../../psa.app.core/models/compliance';

@Component({
  selector: 'app-compliance-view-list',
  templateUrl: './compliance-view-list.component.html',
  standalone: false,
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

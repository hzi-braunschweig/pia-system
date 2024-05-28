/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';

export interface PartialDeletionViewHeaderData {
  probandId: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-dialog-view-partial-deletion',
  templateUrl: 'dialog-view-partial-deletion.component.html',
})
export class DialogViewPartialDeletionComponent {
  @Input() labResults: LabResult[] = [];
  @Input() questionnaireInstances: QuestionnaireInstance[] = [];
  @Input() headerData: PartialDeletionViewHeaderData;
  @Input() cancelText: string;
  @Output() cancel = new EventEmitter<MouseEvent>();
  @Output() confirm = new EventEmitter<MouseEvent>();

  public containsData(): boolean {
    return (
      this.questionnaireInstances.length !== 0 || this.labResults.length !== 0
    );
  }
}

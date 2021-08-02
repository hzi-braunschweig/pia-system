/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { DialogSelectForPartialDeletionResult } from '../select/dialog-select-for-partial-deletion.component';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { AlertService } from '../../../_services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';
import { PendingPartialDeletionRequest } from '../../../psa.app.core/models/pendingPartialDeletion';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { PartialDeletionViewHeaderData } from '../view/dialog-view-partial-deletion.component';

export interface DialogCreatePartialDeletionData {
  dataForDelete: DialogSelectForPartialDeletionResult;
}

export interface DialogCreatePartialDeletionResult {
  requestedFor: string;
  probandId: string;
  successfullyCreated: boolean;
}

@Component({
  selector: 'app-dialog-create-partial-deletion',
  templateUrl: 'dialog-create-partial-deletion.component.html',
})
export class DialogCreatePartialDeletionComponent {
  deleteLogs: boolean = false;
  labResults: LabResult[] = [];
  questionnaireInstances: QuestionnaireInstance[] = [];
  isLoading: boolean = true;
  headerData: PartialDeletionViewHeaderData;

  constructor(
    private questionnaireService: QuestionnaireService,
    private authService: AuthService,
    private alertService: AlertService,
    private datePipe: DatePipe,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<
      DialogCreatePartialDeletionComponent,
      DialogCreatePartialDeletionResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: DialogCreatePartialDeletionData
  ) {
    this.headerData = {
      probandId: data.dataForDelete.probandId,
      startDate: data.dataForDelete.startDate
        ? datePipe.transform(data.dataForDelete.startDate)
        : translate.instant(
            'DIALOG.PARTIAL_DELETION.DATE_OF_FIRST_REGISTRATION'
          ),
      endDate: data.dataForDelete.endDate
        ? datePipe.transform(data.dataForDelete.endDate)
        : translate.instant('DIALOG.PARTIAL_DELETION.DATE_OF_TODAY'),
    };

    this.deleteLogs = data.dataForDelete.deleteLogs;

    this.labResults = data.dataForDelete.labResults;
    const questionnaires = data.dataForDelete.questionnaires;

    this.questionnaireService
      .getQuestionnaireInstancesForUser(this.data.dataForDelete.probandId)
      .then((questionnaireInstances) => {
        this.questionnaireInstances = questionnaireInstances.filter(
          (questionnaireInstance: QuestionnaireInstance) => {
            if (
              !['released', 'released_once', 'released_twice'].includes(
                questionnaireInstance.status
              )
            ) {
              return false;
            }
            const releaseDate = questionnaireInstance.date_of_release_v2
              ? questionnaireInstance.date_of_release_v2
              : questionnaireInstance.date_of_release_v1;
            if (
              data.dataForDelete.startDate &&
              releaseDate < data.dataForDelete.startDate
            ) {
              return false;
            }
            if (
              data.dataForDelete.endDate &&
              releaseDate > data.dataForDelete.endDate
            ) {
              return false;
            }
            return questionnaires.some(
              (questionnaire) =>
                questionnaireInstance.questionnaire_id === questionnaire.id &&
                questionnaireInstance.questionnaire_version ===
                  questionnaire.version
            );
          }
        );
      })
      .catch((err: HttpErrorResponse) => {
        alertService.errorObject(err);
      })
      .finally(() => (this.isLoading = false));
  }

  public async confirmDeletion(): Promise<void> {
    const dataRequest: PendingPartialDeletionRequest = {
      requestedFor: this.data.dataForDelete.userForApprove,
      probandId: this.data.dataForDelete.probandId,
      fromDate: this.data.dataForDelete.startDate,
      toDate: this.data.dataForDelete.endDate,
      deleteLogs: this.data.dataForDelete.deleteLogs,
      forInstanceIds: this.questionnaireInstances.map(
        (instance) => instance.id
      ),
      forLabResultsIds: this.labResults.map((result) => result.id),
    };
    try {
      await this.authService.postPendingPartialDeletion(dataRequest);
      this.dialogRef.close({
        successfullyCreated: true,
        probandId: this.data.dataForDelete.probandId,
        requestedFor: this.data.dataForDelete.userForApprove,
      });
    } catch (err) {
      this.alertService.errorObject(err);
      this.dialogRef.close({
        successfullyCreated: false,
        probandId: this.data.dataForDelete.probandId,
        requestedFor: this.data.dataForDelete.userForApprove,
      });
    }
  }

  public cancelDeletion(): void {
    this.dialogRef.close();
  }
}

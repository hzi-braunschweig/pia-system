import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { AlertService } from '../../../_services/alert.service';
import { HttpErrorResponse } from '@angular/common/http';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { PendingPartialDeletionResponse } from '../../../psa.app.core/models/pendingPartialDeletion';
import { DatePipe } from '@angular/common';
import { PartialDeletionViewHeaderData } from '../view/dialog-view-partial-deletion.component';
import { TranslateService } from '@ngx-translate/core';

export interface DialogConfirmPartialDeletionData {
  partialDeletionResponse: PendingPartialDeletionResponse;
}

export interface DialogConfirmPartialDeletionResult {
  probandId: string;
  successfullyRejected?: boolean;
  successfullyConfirmed?: boolean;
}

@Component({
  selector: 'app-dialog-confirm-partial-deletion',
  templateUrl: 'dialog-confirm-partial-deletion.component.html',
})
export class DialogConfirmPartialDeletionComponent {
  deleteLogs: boolean = false;
  labResults: LabResult[] = [];
  questionnaireInstances: QuestionnaireInstance[] = [];
  isLoading: boolean = true;
  headerData: PartialDeletionViewHeaderData;

  constructor(
    private questionnaireService: QuestionnaireService,
    private authservice: AuthService,
    private sampleTrackingService: SampleTrackingService,
    private alertService: AlertService,
    private datePipe: DatePipe,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<
      DialogConfirmPartialDeletionComponent,
      DialogConfirmPartialDeletionResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: DialogConfirmPartialDeletionData
  ) {
    this.headerData = {
      probandId: data.partialDeletionResponse.probandId,
      startDate:
        data.partialDeletionResponse.fromDate.getTime() === 0
          ? translate.instant(
              'DIALOG.PARTIAL_DELETION.DATE_OF_FIRST_REGISTRATION'
            )
          : datePipe.transform(data.partialDeletionResponse.fromDate),
      endDate: datePipe.transform(data.partialDeletionResponse.toDate),
    };

    this.deleteLogs = data.partialDeletionResponse.deleteLogs;

    const fetchingLabresultsPromise = this.sampleTrackingService
      .getAllLabResultsForUser(data.partialDeletionResponse.probandId)
      .then((labResults: LabResult[]) => {
        this.labResults = labResults.filter((labResult: LabResult) =>
          data.partialDeletionResponse.forLabResultsIds.includes(labResult.id)
        );
      })
      .catch((err: HttpErrorResponse) => {
        alertService.errorObject(err);
      });

    const fetchingQuestionnaireInstancespromise = this.questionnaireService
      .getQuestionnaireInstancesForUser(data.partialDeletionResponse.probandId)
      .then((questionnaireInstances: QuestionnaireInstance[]) => {
        this.questionnaireInstances = questionnaireInstances.filter(
          (questionnaireInstance: QuestionnaireInstance) =>
            data.partialDeletionResponse.forInstanceIds.includes(
              questionnaireInstance.id
            )
        );
      })
      .catch((err: HttpErrorResponse) => {
        alertService.errorObject(err);
      });
    Promise.all([
      fetchingLabresultsPromise,
      fetchingQuestionnaireInstancespromise,
    ]).finally(() => (this.isLoading = false));
  }

  public async confirmDeletion(): Promise<void> {
    try {
      await this.authservice.putPendingPartialDeletion(
        this.data.partialDeletionResponse.id
      );
      this.dialogRef.close({
        successfullyConfirmed: true,
        probandId: this.data.partialDeletionResponse.probandId,
      });
    } catch (err) {
      this.alertService.errorObject(err);
      this.dialogRef.close({
        successfullyConfirmed: false,
        probandId: this.data.partialDeletionResponse.probandId,
      });
    }
  }

  public async rejectDeletion(): Promise<void> {
    try {
      await this.authservice.deletePendingPartialDeletion(
        this.data.partialDeletionResponse.id
      );
      this.dialogRef.close({
        successfullyRejected: true,
        probandId: this.data.partialDeletionResponse.probandId,
      });
    } catch (err) {
      this.alertService.errorObject(err);
      this.dialogRef.close({
        successfullyRejected: false,
        probandId: this.data.partialDeletionResponse.probandId,
      });
    }
  }
}

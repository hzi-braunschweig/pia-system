import { Component } from '@angular/core';
import { Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {
  CustomNotificationDto,
  QuestionnaireNotificationDto,
  SampleNotificationDto,
} from '../psa.app.core/models/notification';

@Component({
  selector: 'app-notification',
  template: ` <div></div> `,
})
export class NotificationComponent {
  currentUsername: string;

  constructor(public dialog: MatDialog, private router: Router) {
    this.currentUsername = JSON.parse(
      localStorage.getItem('currentUser')
    ).username;
  }

  presentLabReport(notificationData: SampleNotificationDto): void {
    const id = notificationData.reference_id;

    const dialogRef = this.dialog.open(DialogNotificationComponent, {
      width: '500px',
      data: {
        title: notificationData.title,
        body: notificationData.body,
        type: 'labResult',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result === 'ok') {
        this.router.navigate(['/laboratory-results', id], {
          queryParams: { user_id: this.currentUsername },
        });
      }
    });
  }

  presentCustom(notificationData: CustomNotificationDto): void {
    const dialogRef = this.dialog.open(DialogNotificationComponent, {
      width: '500px',
      data: {
        title: notificationData.title,
        body: notificationData.body,
        type: 'custom',
      },
    });
  }

  presentQreminder(notificationData: QuestionnaireNotificationDto): void {
    const id = notificationData.reference_id;
    const questionnaire_id = notificationData.questionnaire_id;

    const dialogRef = this.dialog.open(DialogNotificationComponent, {
      width: '500px',
      data: {
        title: notificationData.title,
        body: notificationData.body,
        type: 'qReminder',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result === 'ok') {
        this.router.navigate(['/questionnaire', questionnaire_id, id]);
      }
    });
  }
}

@Component({
  selector: 'dialog-notification',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      {{ data.title }}
    </h1>
    <div mat-dialog-content>
      {{ data.body }}
    </div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="cancelButton" mat-raised-button (click)="cancel()">
        {{ 'PLANNED_PROBANDS.CLOSE' | translate }}
      </button>
      <button
        id="confirmButton"
        mat-raised-button
        color="primary"
        *ngIf="data.type !== 'custom'"
        (click)="confirmSelection()"
      >
        {{ 'GENERAL.OPEN' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogNotificationComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close('ok');
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

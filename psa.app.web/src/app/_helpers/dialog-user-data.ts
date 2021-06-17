import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-user-data',
  template: `
    <mat-dialog-content style="	text-align: left;margin-bottom:15px">{{
      'STUDIES.PROBAND_DATA' | translate
    }}</mat-dialog-content>
    <ul style="font-size:14px;	text-align: left">
      <li>{{ 'LOGIN.USERNAME' | translate }}: {{ data.username }}</li>
      <li>{{ 'LOGIN.PASSWORD' | translate }}: {{ data.password }}</li>
      <li>{{ 'QUESTIONNAIRES_FORSCHER.ROLE' | translate }}: {{ data.role }}</li>
      <li>{{ 'DIALOG.ACCESS_LEVEL' | translate }}:</li>
      <ul
        *ngFor="let acces_level of this.access_level"
        style="font-size:14px;	text-align: left"
      >
        <li>{{ this.access_level ? acces_level : '' }}</li>
      </ul>
    </ul>
    <hr />
    <mat-dialog-actions align="end">
      <button id="confirmbutton" mat-button (click)="confirmSelection()">
        OK
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogUserDataComponent {
  access_level: string[] = [''];
  study_name: string[] = [''];

  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<DialogUserDataComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (
      data.study_accesses &&
      data.study_accesses !== [] &&
      data.study_accesses[0] !== undefined
    ) {
      data.study_accesses.forEach((study_access, studyIndex) => {
        this.access_level[studyIndex] = study_access.access_level;
        if (this.access_level[studyIndex] === 'read') {
          this.access_level[studyIndex] = this.translate.instant('DIALOG.READ');
        } else if (this.access_level[studyIndex] === 'write') {
          this.access_level[studyIndex] =
            this.translate.instant('DIALOG.WRITE');
        } else if (this.access_level[studyIndex] === 'admin') {
          this.access_level[studyIndex] =
            this.translate.instant('DIALOG.ADMIN');
        }
        this.access_level[studyIndex] =
          study_access.study_id + '(' + this.access_level[studyIndex] + ')';
      });
    }
  }

  confirmSelection(): void {
    this.dialogRef.close();
  }
}

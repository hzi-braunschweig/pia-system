import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-questionnire-fail',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      <button disabled mat-icon-button style="margin:10px;margin-right:70px;">
        <mat-icon style="font-size: 100px; color:#7dd4ff;">cancel</mat-icon>
      </button>
    </h1>
    <div mat-dialog-content>
      {{ 'DIALOG.FAIL' | translate: data }}
    </div>
    <hr />
    <mat-dialog-actions align="end">
      <button id="confirmbutton" mat-button (click)="confirmSelection()">
        OK
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogQuestionnaireFailComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<DialogQuestionnaireFailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close();
  }
}

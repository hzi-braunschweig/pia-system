import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-yes-no',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; ">
      {{ data.content | translate }}
    </h1>
    <div mat-dialog-content></div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="confirmButton" mat-button (click)="confirmSelection()">
        {{ 'GENERAL.YES' | translate }}
      </button>
      <button id="cancelButton" mat-button (click)="cancel()">
        {{ 'GENERAL.NO' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogYesNoComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close('yes');
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

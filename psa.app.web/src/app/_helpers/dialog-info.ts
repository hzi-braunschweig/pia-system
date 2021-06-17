import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'dialog-info',
  template: `
    <h1 mat-dialog-title style=" display: flex; justify-content: center; "></h1>
    <div mat-dialog-content>
      {{ data.content }}
    </div>
    <hr />
    <mat-dialog-actions align="center">
      <button id="confirmbutton" mat-button (click)="confirmSelection()">
        OK
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogInfoComponent {
  constructor(
    public translate: TranslateService,
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirmSelection(): void {
    this.dialogRef.close();
  }
}

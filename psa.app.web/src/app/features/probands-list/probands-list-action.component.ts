import { Component } from '@angular/core';

@Component({
  selector: 'app-probands-list-action',
  template: `
    <button mat-raised-button color="primary" style="margin-right: 15px;">
      <ng-content></ng-content>
    </button>
  `,
})
export class ProbandsListActionComponent {}

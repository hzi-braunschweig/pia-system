import { NgModule } from '@angular/core';
import { MatOptionSelectAllComponent } from './mat-option-select-all.component';

import { MatPseudoCheckboxModule } from '@angular/material/core';

@NgModule({
  declarations: [MatOptionSelectAllComponent],
  exports: [MatOptionSelectAllComponent],
  imports: [MatPseudoCheckboxModule],
})
export class MatOptionSelectAllModule {}

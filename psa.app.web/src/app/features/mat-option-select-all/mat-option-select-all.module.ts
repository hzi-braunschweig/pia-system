/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { MatOptionSelectAllComponent } from './mat-option-select-all.component';

import { MatPseudoCheckboxModule } from '@angular/material/core';

@NgModule({
  declarations: [MatOptionSelectAllComponent],
  exports: [MatOptionSelectAllComponent],
  imports: [MatPseudoCheckboxModule],
})
export class MatOptionSelectAllModule {}

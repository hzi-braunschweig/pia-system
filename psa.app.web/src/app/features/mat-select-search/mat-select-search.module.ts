/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { MatSelectSearchComponent } from './mat-select-search.component';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule, MatInputModule],
  declarations: [MatSelectSearchComponent],
  exports: [MatButtonModule, MatInputModule, MatSelectSearchComponent],
})
export class MatSelectSearchModule {}

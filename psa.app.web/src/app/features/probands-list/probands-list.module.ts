/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { TranslateModule } from '@ngx-translate/core';
import { ProbandsListComponent } from './probands-list.component';
import { TranslatedUserFactory } from './translated-user/translated-user.factory';
import { LoadingSpinnerModule } from '../loading-spinner/loading-spinner.module';
import {
  ProbandsListEntryActionComponent,
  ProbandsListEntryActionButtonComponent,
} from './probands-list-entry-action.component';
import { ProbandsListActionComponent } from './probands-list-action.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule.forChild(),
    FlexLayoutModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatRadioModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatSortModule,
    LoadingSpinnerModule,
  ],
  declarations: [
    ProbandsListComponent,
    ProbandsListActionComponent,
    ProbandsListEntryActionComponent,
    ProbandsListEntryActionButtonComponent,
  ],
  exports: [
    ProbandsListComponent,
    ProbandsListActionComponent,
    ProbandsListEntryActionComponent,
    ProbandsListEntryActionButtonComponent,
  ],
  providers: [TranslatedUserFactory],
})
export class ProbandsListModule {}

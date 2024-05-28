/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PublicApiRoutingModule } from './public-api-routing.module';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { PublicApiComponent } from './public-api.component';
import { LoadingSpinnerModule } from '../../features/loading-spinner/loading-spinner.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { EventHistorySettingsComponent } from './event-history-settings/event-history-settings.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { HintComponent } from '../../features/hint/hint.component';

@NgModule({
  declarations: [PublicApiComponent, EventHistorySettingsComponent],
  imports: [
    CommonModule,
    PublicApiRoutingModule,
    TranslateModule.forChild(),
    LoadingSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    ClipboardModule,
    MatDialogModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    HintComponent,
  ],
})
export class PublicApiModule {}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateViewerComponent } from './template-viewer.component';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ConsentInputRadioComponent } from './pia-custom-tags/consent-input-radio/consent-input-radio.component';
import { ConsentInputTextComponent } from './pia-custom-tags/consent-input-text/consent-input-text.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConsentInputDateComponent } from './pia-custom-tags/consent-input-date/consent-input-date.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ConsentSwitchRadioComponent } from './pia-custom-tags/consent-switch-radio/consent-switch-radio.component';

@NgModule({
  imports: [
    TranslateModule.forChild(),
    CommonModule,
    MatRadioModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  declarations: [
    TemplateViewerComponent,
    ConsentInputRadioComponent,
    ConsentInputTextComponent,
    ConsentInputDateComponent,
    ConsentSwitchRadioComponent,
  ],
  exports: [TemplateViewerComponent],
})
export class TemplateModule {}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CompliancePageRoutingModule } from './compliance-routing.module';
import { CompliancePage } from './compliance.page';
import { SharedModule } from '../shared/shared.module';
import { TemplateViewerComponent } from './template-viewer/template-viewer.component';
import { ConsentInputRadioComponent } from './template-viewer/pia-custom-tags/consent-input-radio/consent-input-radio.component';
import { ConsentInputTextComponent } from './template-viewer/pia-custom-tags/consent-input-text/consent-input-text.component';
import { ConsentInputDateComponent } from './template-viewer/pia-custom-tags/consent-input-date/consent-input-date.component';
import { ConsentSwitchRadioComponent } from './template-viewer/pia-custom-tags/consent-switch-radio/consent-switch-radio.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule.forChild(),
    CompliancePageRoutingModule,
    SharedModule,
  ],
  declarations: [
    CompliancePage,
    TemplateViewerComponent,
    ConsentInputRadioComponent,
    ConsentInputTextComponent,
    ConsentInputDateComponent,
    ConsentSwitchRadioComponent,
  ],
  providers: [DatePipe],
})
export class CompliancePageModule {}

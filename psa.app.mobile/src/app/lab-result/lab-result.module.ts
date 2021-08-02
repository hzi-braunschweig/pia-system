/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { LabResultRoutingModule } from './lab-result-routing.module';
import { LabResultListPage } from './lab-result-list/lab-result-list.page';
import { LabResultDetailPage } from './lab-result-detail/lab-result-detail.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    SharedModule,
    LabResultRoutingModule,
  ],
  declarations: [LabResultListPage, LabResultDetailPage],
})
export class LabResultModule {}

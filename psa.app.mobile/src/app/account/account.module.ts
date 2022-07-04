/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { KeepStudyAnswersModalComponent } from './components/keep-study-answers-modal/keep-study-answers-modal.component';
import { DeleteAccountModalComponent } from './components/delete-account-modal/delete-account-modal.component';

@NgModule({
  declarations: [KeepStudyAnswersModalComponent, DeleteAccountModalComponent],
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    IonicModule,
    SharedModule,
  ],
})
export class AccountModule {}

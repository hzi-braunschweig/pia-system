/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ContactPageRoutingModule } from './contact-routing.module';
import { ContactPage } from './contact.page';
import { SharedModule } from '../shared/shared.module';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule.forChild(),
    ContactPageRoutingModule,
    SharedModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    ContactPage,
  ],
})
export class ContactPageModule {}

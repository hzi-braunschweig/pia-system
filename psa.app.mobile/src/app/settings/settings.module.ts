/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsPageRoutingModule } from './settings-routing.module';
import { SettingsPage } from './settings.page';
import { SharedModule } from '../shared/shared.module';
import { LicenseListPage } from './license-list/license-list.page';
import { AccountModule } from '../account/account.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  IonContent,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule.forChild(),
    SettingsPageRoutingModule,
    SharedModule,
    AccountModule,
    ScrollingModule,
    IonContent,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonItem,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSkeletonText,
    SettingsPage,
    LicenseListPage,
  ],
})
export class SettingsPageModule {}

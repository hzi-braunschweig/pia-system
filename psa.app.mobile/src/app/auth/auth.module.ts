/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { LoginPage } from './login/login.page';
import { ChangePasswordPage } from './change-password/change-password.page';
import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from '../shared/shared.module';
import { InputPasswordComponent } from './input-password/input-password.component';
import { Market } from '@awesome-cordova-plugins/market/ngx';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { LoginUsernameComponent } from './login-username/login-username.component';
import { LoginPasswordLegacyComponent } from './login-password-legacy/login-password-legacy.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    AuthRoutingModule,
    SharedModule,
    ReactiveFormsModule,
  ],
  declarations: [
    LoginPage,
    ChangePasswordPage,
    InputPasswordComponent,
    LoginUsernameComponent,
    LoginPasswordLegacyComponent,
  ],
  providers: [Market, AppVersion],
})
export class AuthModule {}

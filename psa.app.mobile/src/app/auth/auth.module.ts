import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { LoginPage } from './login/login.page';
import { ChangePasswordPage } from './change-password/change-password.page';
import { AuthRoutingModule } from './auth-routing.module';
import { SharedModule } from '../shared/shared.module';

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
  declarations: [LoginPage, ChangePasswordPage],
})
export class AuthModule {}

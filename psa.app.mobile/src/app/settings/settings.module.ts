import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { SettingsPageRoutingModule } from './settings-routing.module';
import { SettingsPage } from './settings.page';
import { SharedModule } from '../shared/shared.module';
import { LicenseListPage } from './license-list/license-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    SettingsPageRoutingModule,
    SharedModule,
  ],
  declarations: [SettingsPage, LicenseListPage],
})
export class SettingsPageModule {}

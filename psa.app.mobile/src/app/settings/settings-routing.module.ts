import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SettingsPage } from './settings.page';
import { AuthModule } from '../auth/auth.module';
import { LicenseListPage } from './license-list/license-list.page';

const routes: Routes = [
  {
    path: '',
    component: SettingsPage,
  },
  {
    path: 'licenses',
    component: LicenseListPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes), AuthModule],
  exports: [RouterModule],
})
export class SettingsPageRoutingModule {}

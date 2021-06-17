import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthModule } from '../auth/auth.module';
import { CompliancePage } from './compliance.page';

const routes: Routes = [
  {
    path: '',
    component: CompliancePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes), AuthModule],
  exports: [RouterModule],
})
export class CompliancePageRoutingModule {}

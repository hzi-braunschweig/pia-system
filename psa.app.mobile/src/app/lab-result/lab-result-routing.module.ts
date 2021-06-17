import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LabResultListPage } from './lab-result-list/lab-result-list.page';
import { LabResultDetailPage } from './lab-result-detail/lab-result-detail.page';

const routes: Routes = [
  {
    path: '',
    component: LabResultListPage,
  },
  {
    path: ':labResultId',
    component: LabResultDetailPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LabResultRoutingModule {}

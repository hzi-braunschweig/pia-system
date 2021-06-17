import { NgModule } from '@angular/core';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  imports: [MatProgressSpinnerModule],
  declarations: [LoadingSpinnerComponent],
  exports: [LoadingSpinnerComponent],
})
export class LoadingSpinnerModule {}

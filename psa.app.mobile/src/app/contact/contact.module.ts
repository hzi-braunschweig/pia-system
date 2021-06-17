import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { ContactPageRoutingModule } from './contact-routing.module';
import { ContactPage } from './contact.page';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    ContactPageRoutingModule,
    SharedModule,
  ],
  declarations: [ContactPage],
})
export class ContactPageModule {}

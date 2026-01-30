/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ContainerForFormControlUsageComponent } from './container-for-form-control-usage.component';
import { TemplateSegment } from '../segment.model';
import { IonList } from '@ionic/angular/standalone';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { ConsentInputRadioComponent } from './pia-custom-tags/consent-input-radio/consent-input-radio.component';
import { ConsentInputTextComponent } from './pia-custom-tags/consent-input-text/consent-input-text.component';
import { ConsentInputDateComponent } from './pia-custom-tags/consent-input-date/consent-input-date.component';
import { ConsentSwitchRadioComponent } from './pia-custom-tags/consent-switch-radio/consent-switch-radio.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-template-viewer',
  templateUrl: './template-viewer.component.html',
  styleUrls: ['./template-viewer.component.scss'],
  imports: [
    IonList,
    NgFor,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    ConsentInputRadioComponent,
    ConsentInputTextComponent,
    ConsentInputDateComponent,
    ConsentSwitchRadioComponent,
    TranslateModule,
  ],
})
export class TemplateViewerComponent extends ContainerForFormControlUsageComponent {
  @Input()
  public segments: TemplateSegment[];
  @Input()
  public form: FormGroup;
}

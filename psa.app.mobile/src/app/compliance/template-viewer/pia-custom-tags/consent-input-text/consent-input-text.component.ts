/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import { ConsentInputRadioComponent } from '../consent-input-radio/consent-input-radio.component';
import { IonItem, IonInput } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-consent-input-text',
  templateUrl: './consent-input-text.component.html',
  imports: [IonItem, IonInput, ReactiveFormsModule],
})
export class ConsentInputTextComponent
  extends ConsentInputRadioComponent
  implements OnInit
{
  @Input()
  public label: string;

  ngOnInit(): void {
    super.ngOnInit();
    // resolve label for input field if necessary
    const labelAttr = this.resolveAttr('label');
    if (labelAttr) {
      this.label = labelAttr.value;
    }
  }
}

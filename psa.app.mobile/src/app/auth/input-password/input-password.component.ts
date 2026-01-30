/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { addIcons } from 'ionicons';
import { eye } from 'ionicons/icons';
import {
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

const INPUT_PASSWORD_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InputPasswordComponent),
  multi: true,
};

@Component({
  selector: 'app-input-password',
  templateUrl: './input-password.component.html',
  styleUrls: ['./input-password.component.scss'],
  providers: [INPUT_PASSWORD_ACCESSOR],
  imports: [IonItem, IonInput, ReactiveFormsModule, NgIf, IonButton, IonIcon],
})
export class InputPasswordComponent extends AbstractControlValueAccessor<string> {
  @Input()
  revealPassword = false;

  @Input()
  disabled = false;

  constructor() {
    addIcons({ eye });
    super();
  }
}

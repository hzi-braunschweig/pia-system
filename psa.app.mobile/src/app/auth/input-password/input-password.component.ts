/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';

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
})
export class InputPasswordComponent extends AbstractControlValueAccessor<string> {
  @Input()
  revealPassword = false;

  @Input()
  disabled = false;
}

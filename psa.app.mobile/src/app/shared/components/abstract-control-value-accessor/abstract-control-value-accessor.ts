/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ControlValueAccessor, FormControl } from '@angular/forms';
import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

/**
 * This abstract class needs to be declared as Component in order to be
 * correctly picked up by the Angular compiler. Nevertheless it is not
 * intended to be used as Component directly.
 *
 * @see {@link https://v9.angular.io/guide/deprecations#undecorated-base-classes-using-angular-features}
 */
@Component({ template: '' })
// tslint:disable-next-line:component-class-suffix
export abstract class AbstractControlValueAccessor<V>
  implements ControlValueAccessor, OnDestroy
{
  @Input()
  label: string;

  @Input()
  name: string | number;

  control: FormControl = new FormControl(null);

  disabled = false;

  protected subscription: Subscription;

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  registerOnChange(onChange: (value: V) => void) {
    this.subscription = this.control.valueChanges.subscribe((value) =>
      onChange(value)
    );
  }

  registerOnTouched(fn) {}

  writeValue(value: V) {
    this.control.patchValue(value);
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}

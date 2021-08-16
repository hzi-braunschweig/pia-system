/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { AbstractControlValueAccessor } from './abstract-control-value-accessor';

/**
 * This abstract class needs to be declared as Component in order to be
 * correctly picked up by the Angular compiler. Nevertheless it is not
 * intended to be used as Component directly.
 *
 * @see {@link https://v9.angular.io/guide/deprecations#undecorated-base-classes-using-angular-features}
 */
@Component({ template: '' })
// tslint:disable-next-line:component-class-suffix
export abstract class AbstractTextInputControlValueAccessor<
  V
> extends AbstractControlValueAccessor<V> {
  constructor(protected keyboard: Keyboard) {
    super();
  }

  hideKeyboard(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.keyboard.isVisible) {
      this.keyboard.hide();
    }
  }
}

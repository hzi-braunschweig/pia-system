import { ControlValueAccessor, FormControl } from '@angular/forms';
import { Component, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';

/**
 * This abstract class needs to be declared as Component in order to be
 * correctly picked up by the Angular compiler. Nevertheless it is not
 * intended to be used as Component directly.
 *
 * @see {@link https://v9.angular.io/guide/deprecations#undecorated-base-classes-using-angular-features}
 */
@Component({ template: '' })
// tslint:disable-next-line:component-class-suffix
export abstract class QuestionnaireAnswerControlValueAccessor
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

  registerOnChange(onChange: (value: FormControlValue) => void) {
    this.subscription = this.control.valueChanges.subscribe((value) =>
      onChange(value)
    );
  }

  registerOnTouched(fn) {}

  writeValue(value: FormControlValue) {
    this.control.patchValue(value);
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { filter } from 'rxjs/operators';
import { merge, Subscription } from 'rxjs';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';
import {
  InputCustomEvent,
  IonItem,
  IonLabel,
  IonInput,
  IonChip,
  IonIcon,
  IonList,
  IonCheckbox,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle } from 'ionicons/icons';
import { NgIf, NgFor } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

const QUESTIONNAIRE_ANSWER_CHECKBOX_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerMultiSelectComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-multi-select',
  templateUrl: './questionnaire-answer-multi-select.component.html',
  providers: [QUESTIONNAIRE_ANSWER_CHECKBOX_ACCESSOR],
  imports: [
    NgIf,
    IonItem,
    IonLabel,
    IonInput,
    IonChip,
    IonIcon,
    IonList,
    NgFor,
    IonCheckbox,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class QuestionnaireAnswerMultiSelectComponent
  extends AbstractControlValueAccessor<FormControlValue>
  implements OnInit, OnDestroy
{
  @Input()
  values: string[] = [];
  @Input()
  useAutocomplete: boolean | null;

  filteredValues: string[];
  showAutocompleteOptions = false;

  /**
   * All possible NO_ANSWER values from all supported languages.
   * These values are matched against the questionnaire's answer values.
   * see {@link QuestionnaireAnswerMultiSelectComponent#setUpNoAnswerBehaviour}
   */
  private readonly NO_ANSWER_VALUES = [
    'Keine Angabe', // de-DE, de-CH
    'Not specified', // en-US
    'Pas de réponse', // fr-FR
    'Sin respuesta', // es-ES
  ];

  form: FormArray = new FormArray([]);

  private noAnswerSubscription: Subscription;
  private otherAnswersSubscription: Subscription;

  constructor() {
    addIcons({ closeCircle });
    super();
  }

  ngOnInit() {
    this.values.forEach(() => this.form.push(new FormControl(false)));
    this.setUpNoAnswerBehaviour();
    this.filteredValues = this.values;
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    this.cancelSubscriptions();
  }

  getFormControlAt(i: number): FormControl {
    return this.form.at(i) as FormControl;
  }

  registerOnChange(onChange: (value: string[]) => void) {
    this.subscription = this.form.valueChanges.subscribe(
      (selected: boolean[]) => this.onChange(selected, onChange)
    );
  }

  writeValue(selected: string[]) {
    this.values.forEach((value, index) =>
      this.form
        .at(index)
        .setValue(selected.includes(value), { emitEvent: false })
    );
  }

  onChange(selected: boolean[], onChange: (value: string[]) => void) {
    onChange(this.values.filter((value, index) => selected[index]));
  }

  /**
   * The "no answer" option is hard-coded with a special behaviour:
   * As soon as it is chosen, no other option may be selected, so those will be reset.
   * If the "no answer" option is currently selected and another option is chosen,
   * the "no answer" option will be reset.
   *
   * This logic has the potential of starting a change loop within the form. Thus, it has
   * to be handled carefully. This is why the logic might seem overly complex.
   */
  private setUpNoAnswerBehaviour() {
    const noAnswerValueIndex = this.values.findIndex((value) =>
      this.NO_ANSWER_VALUES.includes(value)
    );

    if (noAnswerValueIndex !== -1) {
      const noAnswerFormControl = this.form.at(noAnswerValueIndex);
      const otherFormControls = this.form.controls.filter(
        (control, index) => index !== noAnswerValueIndex
      );
      this.noAnswerSubscription = noAnswerFormControl.valueChanges
        .pipe(filter(Boolean))
        .subscribe(() =>
          otherFormControls.forEach((control) =>
            control.patchValue(false, { emitEvent: false })
          )
        );
      this.otherAnswersSubscription = merge(
        ...otherFormControls.map((control) => control.valueChanges)
      )
        .pipe(filter(Boolean))
        .subscribe(() =>
          noAnswerFormControl.patchValue(false, { emitEvent: false })
        );
    }
  }

  private cancelSubscriptions() {
    if (this.noAnswerSubscription) {
      this.noAnswerSubscription.unsubscribe();
    }
    if (this.otherAnswersSubscription) {
      this.otherAnswersSubscription.unsubscribe();
    }
  }

  filterValues(event: InputCustomEvent) {
    const filterValue = event.detail.value?.toLowerCase() ?? '';
    this.filteredValues = this.values.filter((value) =>
      value.toLowerCase().includes(filterValue)
    );
    this.showAutocompleteOptions = true;
  }

  private getFormControlForValue(value: string) {
    const index = this.values.findIndex((valueEl) => valueEl === value);
    if (index >= 0) {
      return this.getFormControlAt(index);
    } else {
      throw new Error(`value ${value} not found in the forms array`);
    }
  }

  private setFormControlValueForValue(value: string, state: boolean) {
    this.getFormControlForValue(value).setValue(state, { emitEvent: true });
  }

  selectValue(value: string) {
    this.setFormControlValueForValue(value, true);
    this.showAutocompleteOptions = false;
  }

  deselectValue(value: string) {
    this.setFormControlValueForValue(value, false);
  }

  displayAutocomplete() {
    this.showAutocompleteOptions = true;
  }
}

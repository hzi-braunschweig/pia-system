/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';

const QUESTIONNAIRE_ANSWER_SINGLE_SELECT_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerSingleSelectComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-single-select',
  templateUrl: './questionnaire-answer-single-select.component.html',
  providers: [QUESTIONNAIRE_ANSWER_SINGLE_SELECT_ACCESSOR],
  styleUrls: ['./questionnaire-answer-single-select.component.scss'],
})
export class QuestionnaireAnswerSingleSelectComponent
  extends AbstractControlValueAccessor<FormControlValue>
  implements OnInit
{
  @Input()
  values: string[];
  @Input()
  useAutocomplete: boolean | null;

  filteredValues: string[];
  showAutocompleteOptions = false;
  isOptionSelected = false;

  ngOnInit() {
    this.filteredValues = this.values;
  }

  filterValues() {
    const filterValue = this.control.value.toLowerCase();
    this.filteredValues = this.values.filter((value) =>
      value.toLowerCase().includes(filterValue)
    );

    this.showAutocompleteOptions = true;
    this.isOptionSelected = false;
  }

  selectValue(value: string) {
    this.isOptionSelected = true;
    this.control.setValue(value);
    this.showAutocompleteOptions = false;
  }

  displayAutocomplete() {
    this.showAutocompleteOptions = true;
  }

  validateAutocompleteInput() {
    setTimeout(() => {
      if (!this.isOptionSelected) {
        const currentValue = this.control.value;
        if (currentValue && !this.values.includes(currentValue)) {
          this.control.setValue('');
        }
      }
      this.showAutocompleteOptions = false;
      this.isOptionSelected = false;
    }, 150);
  }
}

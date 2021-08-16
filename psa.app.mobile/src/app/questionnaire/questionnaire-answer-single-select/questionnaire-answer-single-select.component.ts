/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input } from '@angular/core';
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
export class QuestionnaireAnswerSingleSelectComponent extends AbstractControlValueAccessor<FormControlValue> {
  @Input()
  values: string[];
}

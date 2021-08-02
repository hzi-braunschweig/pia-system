/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { QuestionnaireAnswerTextInputControlValueAccessor } from '../questionnaire-answer-control-value-accessor/questionnaire-answer-text-input-control-value-accessor';

const QUESTIONNAIRE_ANSWER_INPUT_NUMBER_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerInputNumberComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-input-number',
  templateUrl: './questionnaire-answer-input-number.component.html',
  providers: [QUESTIONNAIRE_ANSWER_INPUT_NUMBER_ACCESSOR],
})
export class QuestionnaireAnswerInputNumberComponent extends QuestionnaireAnswerTextInputControlValueAccessor {}

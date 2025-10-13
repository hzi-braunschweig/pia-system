/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-answer-error',
  templateUrl: './questionnaire-answer-error.component.html',
  standalone: false,
})
export class QuestionnaireAnswerErrorComponent {
  @Input()
  control: AbstractControl;

  @Input()
  errorCode: string;
}

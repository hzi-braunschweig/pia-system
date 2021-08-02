/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormGroup, ValidatorFn } from '@angular/forms';
/**
 * Validates an AnswerOption FormGroup based on its show_answer_option value
 *
 * If show_answer_option is true, the corresponding value is required.
 * So, if then the value is null, undefined or an empty string, it will
 * return an error object.
 */
export class RequiredAnswerValidator {
  static get answerRequired(): ValidatorFn {
    return (control: FormGroup) => {
      const isRequired = control.get('show_answer_option').value === true;

      if (isRequired && this.isEmpty(control.get('value').value)) {
        return { answerRequired: true };
      }
      return null;
    };
  }

  /**
   * Explicitly checks for null, undefined and empty string
   * as `false` may be a valid value.
   */
  private static isEmpty(value): boolean {
    return value === null || value === undefined || value === '';
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates whether the expected total questionnaire instance count will be
 * larger than the configured maximum instance count with current form inputs.
 */
export function validateQuestionnaireInstanceCount(
  maxInstanceCount: number
): ValidatorFn {
  const fallbackValue = 1;

  return (formGroup: FormGroup): ValidationErrors | null => {
    const cycleAmount = formGroup.get('cycle_amount')?.value || fallbackValue;
    const cycleUnit = formGroup.get('cycle_unit').value;
    const deactivateAfterDays =
      formGroup.get('deactivate_after_days')?.value || fallbackValue;

    let expectedTotalInstances: number;
    switch (cycleUnit) {
      case 'hour':
        expectedTotalInstances = deactivateAfterDays * (24 / cycleAmount);
        break;
      case 'day':
        expectedTotalInstances = deactivateAfterDays / cycleAmount;
        break;
      case 'week':
        expectedTotalInstances = deactivateAfterDays / 7 / cycleAmount;
        break;
      case 'month':
        expectedTotalInstances = deactivateAfterDays / 30 / cycleAmount;
        break;
      default:
        return null;
    }

    if (expectedTotalInstances > maxInstanceCount) {
      return { questionnaireInstanceCount: true };
    } else {
      return null;
    }
  };
}

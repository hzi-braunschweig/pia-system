/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormGroup } from '@angular/forms';
import { EventHistorySettingsForm } from './event-history-settings-form';

export function validateRetentionTime(
  control: FormGroup<EventHistorySettingsForm>
): { invalidRetentionTime: boolean } | null {
  if (control.value.active && !control.value.retentionTimeInDays) {
    control.controls.retentionTimeInDays.setErrors({
      invalidRetentionTime: true,
    });
    control.controls.retentionTimeInDays.markAsTouched();
    return { invalidRetentionTime: true };
  }

  control.controls.retentionTimeInDays.setErrors(null);
  control.controls.retentionTimeInDays.markAsPristine();
  return null;
}

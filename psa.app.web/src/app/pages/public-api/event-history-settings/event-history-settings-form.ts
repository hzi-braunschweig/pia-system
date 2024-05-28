/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractControl } from '@angular/forms';
import { EventHistorySettingsDto } from './event-history-settings.dto';

export interface EventHistorySettingsForm {
  active: AbstractControl<EventHistorySettingsDto['active']>;
  retentionTimeInDays: AbstractControl<
    EventHistorySettingsDto['retentionTimeInDays']
  >;
}

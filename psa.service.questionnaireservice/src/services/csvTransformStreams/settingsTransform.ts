/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserSettings } from '../../models/userSettings';
import { CsvUserSettingsRow } from '../../models/csvExportRows';
import { CsvTransform } from './csvTransform';

export class SettingsTransform extends CsvTransform<
  UserSettings,
  CsvUserSettingsRow
> {
  /**
   * Transforms a users setting into a csv setting line object.
   */
  protected convertToCsvRow(setting: UserSettings): CsvUserSettingsRow {
    return {
      Proband: setting.account_status === 'no_account' ? '' : setting.username,
      IDS: setting.ids ?? '',
      'Benachrichtigung Uhrzeit': setting.notification_time
        ? setting.notification_time
        : '',
      'Einwilligung Ergebnismitteilung': setting.compliance_labresults
        ? 'Ja'
        : 'Nein',
      'Einwilligung Probenentnahme': setting.compliance_samples ? 'Ja' : 'Nein',
      'Einwilligung Blutprobenentnahme': setting.compliance_bloodsamples
        ? 'Ja'
        : 'Nein',
      Testproband: setting.is_test_proband ? 'Ja' : 'Nein',
    };
  }
}

/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationContentStrategy from './notificationContentStrategy';
import { config } from '../../config';
import { LabResult } from '../../models/labResult';

export default class SampleNotificationContentStrategy
  implements NotificationContentStrategy<LabResult>
{
  private _labResult: LabResult | null = null;

  private get labResult(): LabResult {
    if (this._labResult === null) {
      throw Error('No lab result set');
    }
    return this._labResult;
  }

  public initialize(relation: LabResult): void {
    this._labResult = relation;
  }

  public getInAppTitle(): string {
    return 'Neuer Laborbericht!';
  }

  public getInAppText(): string {
    return 'Eine Ihrer Proben wurde analysiert. Klicken Sie direkt auf diese Nachricht, um das Ergebnis zu öffnen.';
  }

  public getAdditionalData(): null {
    return null;
  }

  public getEmailContent(): { subject: string; text: string; html: string } {
    const text =
      'Liebe:r Nutzer:in,\n\n' +
      'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:\n' +
      '<a href="' +
      config.probandAppUrl +
      '/laboratory-results/' +
      this.labResult.id +
      '">PIA Webapp</a>';

    return {
      subject: 'PIA: ' + this.getInAppTitle(),
      text,
      html: text.replace(/\n/g, '<br>'),
    };
  }
}

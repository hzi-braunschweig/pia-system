/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationContentStrategy from './notificationContentStrategy';
import { DbNotificationSchedules } from '../../models/notification';

export default class DefaultNotificationContentStrategy
  implements NotificationContentStrategy<DbNotificationSchedules>
{
  private _notification: DbNotificationSchedules | null = null;

  private get notification(): DbNotificationSchedules {
    if (this._notification === null) {
      throw Error('No notification set');
    }
    return this._notification;
  }

  public initialize(notification: DbNotificationSchedules): void {
    this._notification = notification;
  }

  public getInAppTitle(): string {
    return this.notification.title ?? '';
  }

  public getInAppText(): string {
    return this.notification.body ?? '';
  }

  public getAdditionalData(): null {
    return null;
  }

  public getEmailContent(): { subject: string; text: string; html: string } {
    return {
      subject: this.getInAppTitle(),
      text: this.getInAppText(),
      html: this.getInAppText().replace(/\r\n|\r|\n/g, '<br>'),
    };
  }
}

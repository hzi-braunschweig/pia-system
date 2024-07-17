/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DbNotificationSchedules } from '../../models/notification';
import NotificationContentStrategy from '../notificationContentStrategies/notificationContentStrategy';

/**
 * Defines the behavior for a strategy, delivering notifications from the notification schedule.
 * The task of delivering a notification include:
 *
 * - sending notifications the strategy is responsible for
 * - checking, rescheduling or deleting a notification schedule when necessary
 * - logging the delivery status, if necessary
 */
export default interface NotificationDeliveryStrategy {
  deliverNotification(
    schedule: DbNotificationSchedules,
    contentStrategy: NotificationContentStrategy<unknown>
  ): Promise<void>;
}

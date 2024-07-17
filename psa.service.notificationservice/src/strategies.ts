/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import NotificationContentStrategy from './services/notificationContentStrategies/notificationContentStrategy';
import ReminderNotificationContentStrategy from './services/notificationContentStrategies/reminderNotificationContentStrategy';
import SampleNotificationContentStrategy from './services/notificationContentStrategies/sampleNotificationContentStrategy';
import DefaultNotificationContentStrategy from './services/notificationContentStrategies/defaultNotificationContentStrategy';
import { NotificationType } from './models/notification';
import NotificationDeliveryStrategy from './services/notificationDeliveryStrategies/notificationDeliveryStrategy';
import ReminderNotificationDeliveryStrategy from './services/notificationDeliveryStrategies/reminderNotificationDeliveryStrategy';
import SampleNotificationDeliveryStrategy from './services/notificationDeliveryStrategies/sampleNotificationDeliveryStrategy';
import CustomNotificationDeliveryStrategy from './services/notificationDeliveryStrategies/customNotificationDeliveryStrategy';
import QuestionnairesStatsAggregatorNotificationDeliveryStrategy from './services/notificationDeliveryStrategies/questionnairesStatsAggregatorNotificationDeliveryStrategy';

export const NotificationContentStrategies: Record<
  NotificationType,
  NotificationContentStrategy<unknown>
> = {
  qReminder: new ReminderNotificationContentStrategy(),
  sample: new SampleNotificationContentStrategy(),
  custom: new DefaultNotificationContentStrategy(),
  questionnaires_stats_aggregator: new DefaultNotificationContentStrategy(),
} as const;

export const NotificationDeliveryStrategies: Record<
  NotificationType,
  NotificationDeliveryStrategy
> = {
  qReminder: new ReminderNotificationDeliveryStrategy(),
  sample: new SampleNotificationDeliveryStrategy(),
  custom: new CustomNotificationDeliveryStrategy(),
  questionnaires_stats_aggregator:
    new QuestionnairesStatsAggregatorNotificationDeliveryStrategy(),
};

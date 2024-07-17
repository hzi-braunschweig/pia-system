/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DbNotificationSchedules {
  id?: number;
  user_id: string | null;
  send_on: Date | null;
  notification_type: NotificationType;
  reference_id: string | null;
  title: string | null;
  body: string | null;
}

export type NotificationType =
  | 'qReminder'
  | 'sample'
  | 'custom'
  | 'questionnaires_stats_aggregator';

export interface Notification {
  date?: Date;
  recipients: string[];
  title: string;
  body: string;
}

export interface NotificationResponse {
  notification_type: Omit<NotificationType, 'questionnaires_stats_aggregator'>;
  reference_id: string;
  title: string | null;
  body: string | null;
  data?: Record<string, unknown>;
}

export interface QuestionnaireNotificationResponse
  extends NotificationResponse {
  notification_type: 'qReminder';
  data: {
    linkToOverview: boolean;
  };
}

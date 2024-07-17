/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type NotificationDto =
  | QuestionnaireNotificationDto
  | SampleNotificationDto
  | CustomNotificationDto;

export interface BaseNotificationDto {
  reference_id: string;
  title: string;
  body: string;
}

export interface QuestionnaireNotificationDto extends BaseNotificationDto {
  notification_type: 'qReminder';
  data: {
    linkToOverview: boolean;
  };
}

export interface SampleNotificationDto extends BaseNotificationDto {
  notification_type: 'sample';
}

export interface CustomNotificationDto extends BaseNotificationDto {
  notification_type: 'custom';
}

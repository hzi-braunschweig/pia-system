/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Cronjob from './cronjobs/cronjob';
import ScheduleInstanceNotificationsCronjob from './cronjobs/scheduleInstanceNotificationsCronjob';
import SendScheduledNotificationsCronjob from './cronjobs/sendScheduledNotificationsCronjob';
import SendDailySampleReportMailsCronjob from './cronjobs/sendDailySampleReportMailsCronjob';
import CheckInstancesDueToBeFilledOutCronjob from './cronjobs/checkInstancesDueToBeFilledOutCronjob';
import SendQuestionnairesStatusAggregatorEmailCronjob from './cronjobs/sendQuestionnairesStatusAggregatorEmailCronjob';

export const Cronjobs: Cronjob[] = [
  new CheckInstancesDueToBeFilledOutCronjob(),
  new SendQuestionnairesStatusAggregatorEmailCronjob(),
  new ScheduleInstanceNotificationsCronjob(),
  new SendScheduledNotificationsCronjob(),
  new SendDailySampleReportMailsCronjob(),
];

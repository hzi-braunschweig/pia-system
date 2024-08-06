/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueTopic } from '@pia/lib-messagequeue';

export type CronTableMap = Map<MessageQueueTopic, string>;

export const CronTable: CronTableMap = new Map([
  [MessageQueueTopic.JOB_EVENTHISTORY_CLEANUP_EVENTS, '0 0 * * *'],
]);

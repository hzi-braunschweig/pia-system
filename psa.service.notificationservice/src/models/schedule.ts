/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NotificationType } from './notification';

export interface Schedule {
  user_id: string;
  reference_id: string;
  id: number;
  title: string;
  body: string;
  send_on: Date;
  notification_type: NotificationType;
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getActivityType' })
export class GetActivityTypePipe implements PipeTransform {
  transform(activityType: any): string | undefined {
    if (activityType === 'login') {
      return 'LOGS.LOGIN';
    }
    if (activityType === 'logout') {
      return 'LOGS.LOGOUT';
    }
    if (activityType === 'q_released_once') {
      return 'LOGS.Q_RELEASED_ONCE';
    }
    if (activityType === 'q_released_twice') {
      return 'LOGS.Q_RELEASED_TWICE';
    }

    return undefined;
  }
}

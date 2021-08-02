/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Color } from './color';
import { StatusCode } from './statusCode';

export class Logging {
  public static colorizeStatus(statusCode: number): string {
    const group = Math.floor(statusCode / StatusCode.GROUP_DIVIDER);
    switch (group) {
      case StatusCode.GROUP_SUCCESS:
        return Color.success(statusCode.toString());
      case StatusCode.GROUP_REDIRECTION:
        return Color.info(statusCode.toString());
      case StatusCode.GROUP_CLIENT_ERROR:
        return Color.warn(statusCode.toString());
      case StatusCode.GROUP_SERVER_ERROR:
        return Color.error(statusCode.toString());
      default:
        return statusCode.toString();
    }
  }
}

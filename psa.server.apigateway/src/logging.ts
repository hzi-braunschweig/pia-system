/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Color } from './color';

class StatusCodeGroup {
  public static readonly DIVIDER = 100;
  public static readonly SUCCESS = 2;
  public static readonly REDIRECTION = 3;
  public static readonly CLIENT_ERROR = 4;
  public static readonly SERVER_ERROR = 5;
}

export class Logging {
  public static colorizeStatus(statusCode: number): string {
    const group = Math.floor(statusCode / StatusCodeGroup.DIVIDER);
    switch (group) {
      case StatusCodeGroup.SUCCESS:
        return Color.success(statusCode.toString());
      case StatusCodeGroup.REDIRECTION:
        return Color.info(statusCode.toString());
      case StatusCodeGroup.CLIENT_ERROR:
        return Color.warn(statusCode.toString());
      case StatusCodeGroup.SERVER_ERROR:
        return Color.error(statusCode.toString());
      default:
        return statusCode.toString();
    }
  }
}

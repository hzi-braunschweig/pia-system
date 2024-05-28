/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chalk from 'chalk';

export class Color {
  public static success(error: string): string {
    return chalk.green(chalk.bold(error));
  }

  public static info(error: string): string {
    return chalk.blue(chalk.bold(error));
  }

  public static warn(error: string): string {
    return chalk.yellow(chalk.bold(error));
  }

  public static error(error: string): string {
    return chalk.red(chalk.bold(error));
  }

  public static route(route: string): string {
    return chalk.blue(route);
  }

  public static serviceName(serviceName: string): string {
    return chalk.cyan(serviceName);
  }

  public static protocol(protocol: string): string {
    return chalk.yellow(protocol);
  }

  public static bool(bool: boolean): string {
    return bool ? Color.success('true') : Color.error('false');
  }

  public static statusCode(statusCode: number): string {
    const HTTP_STATUS_GROUP_SIZE = 100;
    const HTTP_STATUS_GROUP_SUCCESS = 2;
    const HTTP_STATUS_GROUP_REDIRECT = 3;
    const HTTP_STATUS_GROUP_CLIENT_ERROR = 4;
    const HTTP_STATUS_GROUP_SERVER_ERROR = 5;
    switch (Math.floor(statusCode / HTTP_STATUS_GROUP_SIZE)) {
      case HTTP_STATUS_GROUP_SUCCESS:
        return Color.success(statusCode.toString());
      case HTTP_STATUS_GROUP_REDIRECT:
        return Color.warn(statusCode.toString());
      case HTTP_STATUS_GROUP_CLIENT_ERROR:
        return Color.error(statusCode.toString());
      case HTTP_STATUS_GROUP_SERVER_ERROR:
        return Color.error(statusCode.toString());
      default:
        return chalk.bold(statusCode.toString());
    }
  }
}

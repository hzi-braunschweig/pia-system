/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import chalk from 'chalk';

export class Color {
  public static successString(): string {
    return chalk.green('✅');
  }

  public static failureString(): string {
    return chalk.red('❎');
  }

  public static task(task: string): string {
    return chalk.blue(task);
  }

  public static error(error: string): string {
    return chalk.red(chalk.bold(error));
  }
}

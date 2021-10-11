/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * This is a naming strategy for typeorm.
 * Currently this is not working locally because node or typescript has some problems resolving the dependencies
 * correctly, when the package is installed as a symlink.
 * Therefore this is the blue-print with a test. It can be copied into the db configuration file if you need it.
 */
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export class SnakeNamingStrategyWithPlural extends SnakeNamingStrategy {
  public tableName(className: string, customName: string): string {
    const snakeName = super.tableName(className, customName);
    if (customName) {
      return snakeName;
    } else if (snakeName.endsWith('y')) {
      return snakeName.substring(0, snakeName.length - 1) + 'ies';
    } else if (snakeName.endsWith('s')) {
      return snakeName + 'es';
    } else return snakeName + 's';
  }
}

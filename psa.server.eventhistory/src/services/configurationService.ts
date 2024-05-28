/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { dataSource } from '../db';
import { Configuration } from '../entity/configuration';
import { ConfigurationDto } from '../models/configurationDto';

export class ConfigurationService {
  public static async getConfig(): Promise<ConfigurationDto | null> {
    const result = await dataSource.getRepository(Configuration).find();
    return result.length !== 0 ? this.mapEntitiesToDto(result) : null;
  }

  public static async postConfig(
    configuration: ConfigurationDto
  ): Promise<ConfigurationDto> {
    const mappedConfig = Object.entries(configuration).map(([key, value]) => ({
      id: key,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value,
    })) as Configuration[];

    const config = await dataSource
      .getRepository(Configuration)
      .save(mappedConfig);

    return this.mapEntitiesToDto(config);
  }

  /**
   * Translates all rows to properties and values of a single object.
   */
  private static mapEntitiesToDto(rows: Configuration[]): ConfigurationDto {
    return rows.reduce(
      (acc, cur) => ({ ...acc, [cur.id]: cur.value }),
      {}
    ) as ConfigurationDto;
  }
}

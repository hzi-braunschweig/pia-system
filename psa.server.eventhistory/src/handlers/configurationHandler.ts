/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';
import { ConfigurationDto } from '../models/configurationDto';
import { ConfigurationService } from '../services/configurationService';
import { EventService } from '../services/eventService';

export class ConfigurationHandler {
  public static readonly getConfig: Lifecycle.Method =
    async (): Promise<ConfigurationDto> => {
      const result = await ConfigurationService.getConfig();

      if (!result) {
        throw new Error(
          'Initial configuration has not been setup. Migration might have failed.'
        );
      }

      return result;
    };

  public static readonly postConfig: Lifecycle.Method = async (
    request
  ): Promise<ConfigurationDto> => {
    const result = await ConfigurationService.postConfig(
      request.payload as unknown as ConfigurationDto
    );

    if (!result.active) {
      await EventService.clearEvents();
    }

    return result;
  };
}

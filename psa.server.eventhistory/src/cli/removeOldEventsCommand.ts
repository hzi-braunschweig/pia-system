/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EventRepository } from '../repositories/eventRepository';
import { ConfigurationService } from '../services/configurationService';
import { subDays } from 'date-fns';
import { dataSource } from '../db';
import { LessThan } from 'typeorm';
import { Event } from '../entity/event';

export async function RemoveOldEventsCommand(): Promise<void> {
  await dataSource.initialize();

  try {
    const config = await ConfigurationService.getConfig();

    if (!config?.active || !config.retentionTimeInDays) {
      return Promise.resolve();
    }

    const events = await EventRepository.count();
    console.log(`Found ${events} events in the repository`);

    const retentionDate = subDays(new Date(), config.retentionTimeInDays);
    const result = await dataSource.getRepository(Event).delete({
      timestamp: LessThan(retentionDate),
    });
    console.log(
      `Removed ${String(
        result.affected
      )}/${events} older than ${retentionDate.toISOString()}`
    );
  } finally {
    await dataSource.destroy();
  }
}

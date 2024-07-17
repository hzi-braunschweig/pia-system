/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Event } from '../entity/event';
import { EventRepository } from '../repositories/eventRepository';
import { EventType } from '../events';
import { DeepPartial } from 'typeorm';

export class EventService {
  public static async getEvents(filter: {
    studyNames?: string[];
    from?: Date;
    to?: Date;
    type?: EventType;
  }): Promise<Event[]> {
    return (await EventRepository.findByFilter(filter)) as unknown as Event[];
  }

  public static async saveEvent(event: DeepPartial<Event>): Promise<Event> {
    return EventRepository.save(event);
  }

  public static async clearEvents(): Promise<void> {
    return EventRepository.clear();
  }
}

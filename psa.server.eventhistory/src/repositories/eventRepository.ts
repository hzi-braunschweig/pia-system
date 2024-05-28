/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Between,
  FindOptionsWhere,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { dataSource } from '../db';
import { Event } from '../entity/event';
import { EventType } from '../events';

export const EventRepository = dataSource.getRepository(Event).extend({
  async findByFilter(filter: {
    studyNames?: string[];
    from?: Date;
    to?: Date;
    type?: EventType;
  }): Promise<Event[]> {
    return this.find({
      where: {
        ...(filter.studyNames && { studyName: In(filter.studyNames) }),
        ...(filter.type && { type: filter.type }),
        ...getTimestampWhereClause(filter),
      },
      order: {
        timestamp: 'ASC',
      },
    });
  },
});

function getTimestampWhereClause(filter: {
  from?: Date;
  to?: Date;
}): FindOptionsWhere<Pick<Event, 'timestamp'>> {
  if (filter.from && filter.to) {
    return {
      timestamp: Between(filter.from, filter.to),
    };
  } else if (filter.from) {
    return {
      timestamp: MoreThanOrEqual(filter.from),
    };
  } else if (filter.to) {
    return {
      timestamp: LessThanOrEqual(filter.to),
    };
  }

  return {};
}

/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EventTypeString } from '../../events';
import { Event } from '../../entity/event';

export type EventResponseDto = Omit<Event, 'type'> & {
  type: EventTypeString;
};

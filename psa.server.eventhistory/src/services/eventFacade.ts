/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ConfigurationService } from './configurationService';
import { EventService } from './eventService';
import { RequestWithUser } from '../models/requestWithUser';
import {
  EventHistoryIsDisabledError,
  ClientHasNoAccessToStudyError,
} from '../errors';
import { StudyName } from '@pia/lib-publicapi';
import { EventTypeString, EventType } from '../events';
import { EventResponseDto } from '../controllers/public/eventResponseDto';

export class EventFacade {
  public static async getEvents(
    request: RequestWithUser,
    filter: {
      studyName?: StudyName;
      from?: Date;
      to?: Date;
      type?: EventTypeString;
    } = {}
  ): Promise<EventResponseDto[]> {
    await this.assertEnabledEventHistory();

    const allowedStudies = this.getAllowedStudiesFromRequest(request).filter(
      (study) => !filter.studyName || study === filter.studyName
    );

    if (allowedStudies.length === 0 && filter.studyName) {
      throw new ClientHasNoAccessToStudyError();
    }

    return (await EventService.getEvents({
      studyNames: allowedStudies,
      from: filter.from,
      to: filter.to,
      type: filter.type as unknown as EventType,
    })) as unknown as EventResponseDto[];
  }

  private static async assertEnabledEventHistory(): Promise<void> {
    const config = await ConfigurationService.getConfig();
    if (!config?.active || config.retentionTimeInDays === null) {
      throw new EventHistoryIsDisabledError();
    }
  }

  private static getAllowedStudiesFromRequest(
    request: RequestWithUser
  ): string[] {
    if (!request.user.studies.length) {
      return [];
    }
    return request.user.studies;
  }
}

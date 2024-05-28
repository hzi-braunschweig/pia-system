/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { publicApiSecurity } from '@pia/lib-service-core';
import {
  Controller,
  Get,
  Query,
  Request,
  Route,
  Security,
  Tags,
  Response,
  SuccessResponse,
} from 'tsoa';
import { EventFacade } from '../../services/eventFacade';
import { RequestWithUser } from '../../models/requestWithUser';
import { StudyName } from '@pia/lib-publicapi';
import { EventTypeString } from '../../events';
import { EventResponseDto } from './eventResponseDto';
import { StatusCodes } from 'http-status-codes';
import {
  EventHistoryIsDisabledError,
  ClientHasNoAccessToStudyError,
} from '../../errors';

@Route('public/event-history')
@Tags('Event History')
export class EventHistoryController extends Controller {
  /**
   * Returns a list of events that match the given filters
   *
   * @param request The request object
   * @param studyName Name of the study
   * @param from Start date of the time range as ISO 8601 string
   * @param to End date of the time range as ISO 8601 string
   * @param type Type of events to return
   */
  @SuccessResponse(StatusCodes.OK)
  @Response<EventHistoryIsDisabledError>(
    StatusCodes.NOT_FOUND,
    'The event history has been disabled'
  )
  @Response<ClientHasNoAccessToStudyError>(
    StatusCodes.FORBIDDEN,
    'Client has no access to the requested study'
  )
  @Response<Error>(
    StatusCodes.INTERNAL_SERVER_ERROR,
    'An internal error occurred'
  )
  @Security(publicApiSecurity)
  @Get()
  public async getEvents(
    @Request() request: RequestWithUser,
    @Query() studyName?: StudyName,
    @Query() from?: Date,
    @Query() to?: Date,
    @Query() type?: EventTypeString
  ): Promise<EventResponseDto[]> {
    return await EventFacade.getEvents(request, {
      studyName,
      from,
      to,
      type,
    });
  }
}

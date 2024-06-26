/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { MessageQueueService } from '../services/messageQueueService';
import { StudyOfParticipantNotFound } from '../errors';
import { probandAuthClient } from '../clients/authServerClient';

/**
 * This base class defines the necessary methods to implement an event proxy.
 * An implementation of this class should be responsible for handling a keycloak
 * event message and implement logic to translate it or trigger another event.
 *
 * New event proxys need to be registered in `src/config.ts`.
 * See current event proxy implementation for examples, on how to implement
 * your own.
 *
 * Notes: this class cannot be abstract, as we need to define the static async
 * factory method `build()`, which is currently not possible with abstract classes.
 */
export class EventProxy {
  // the pattern for the route you want to filter authserver events by
  public pattern = '';

  /**
   * Factory method which can be called async to initialize e.g. a producer
   * and must return and instance of the proxy class implementation.
   */
  public static async build(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _messageQueueService: MessageQueueService
  ): Promise<EventProxy> {
    await Promise.resolve();
    throw new Error(`Please implement build() method`);
  }

  /**
   * The actual logic to handle an incoming keycloak event
   * and e.g. publishing a new event to another exchange
   */
  public onMessage(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _channel: amqp.Channel
  ): (message: amqp.ConsumeMessage | null) => void {
    throw new Error(`Please implement onMessage() method`);
  }

  /**
   * Helper method to get the study name of a participants account
   * @param username
   * @protected
   */
  protected async getStudyNameOfAccountOrFail(
    username: string
  ): Promise<string> {
    const users = await probandAuthClient.users.find({
      username,
      realm: probandAuthClient.realm,
    });

    const user = users.find((u) => u.username === username);

    if (!user?.id) {
      throw new StudyOfParticipantNotFound(username);
    }

    const groups = (
      await probandAuthClient.users.listGroups({
        id: user.id,
        briefRepresentation: true,
        realm: probandAuthClient.realm,
      })
    )
      .filter((group) => !!group.name)
      .map((group) => group.name);

    if (groups.length === 0 || groups[0] === undefined) {
      throw new StudyOfParticipantNotFound(username);
    }

    return groups[0];
  }
}

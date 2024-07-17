/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { MessageQueueService } from '../services/messageQueueService';
import { StudyOfParticipantNotFound } from '../errors';
import { probandAuthClient } from '../clients/authServerClient';

import { promisify } from 'util';

const sleep = promisify(setTimeout);

/**
 * This base class defines the necessary methods to implement an event proxy.
 * An implementation of this class should be responsible for handling a keycloak
 * event message and implement logic to translate it or trigger another event.
 *
 * New event proxys need to be registered in `src/config.ts`.
 * See current event proxy implementation for examples, on how to implement
 * your own.
 */
export abstract class EventProxy {
  // the pattern for the route you want to filter authserver events by
  public abstract pattern: string;

  /**
   * Factory method which can be called async to initialize e.g. a producer
   * and must return and instance of the proxy class implementation.
   */
  public static async build(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _messageQueueService: MessageQueueService
  ): Promise<EventProxy> {
    return await Promise.reject(new Error(`Please implement build() method`));
  }

  /**
   * The actual logic to handle an incoming keycloak event
   * and e.g. publishing a new event to another exchange
   */
  public onMessage(
    channel: amqp.Channel
  ): (message: amqp.ConsumeMessage | null) => void {
    return (message: amqp.ConsumeMessage | null) => {
      if (!message) {
        return;
      }

      this.forwardMessageToProducer(message)
        .then(() => channel.ack(message, false))
        .catch((reason) => {
          channel.nack(message, false, false);
          console.error(reason);
        });
    };
  }

  /**
   * Helper method to get the study name of a participants account
   * @param username
   */
  protected async getStudyNameOfAccountOrFail(
    username: string
  ): Promise<string> {
    const MAX_RETRIES = 12;
    const RETRY_DELAY = 5000;
    for (let i = 0; ; i++) {
      try {
        return await this.getStudyNameOfAccountOrFailOnce(username);
      } catch (error) {
        if (i === MAX_RETRIES) {
          throw error;
        }
        console.error(error);
        console.error(`retry ${i}/${MAX_RETRIES}`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  private async getStudyNameOfAccountOrFailOnce(
    username: string
  ): Promise<string> {
    const users = await probandAuthClient.users.find({
      username,
      realm: probandAuthClient.realm,
    });

    const user = users.find((u) => u.username === username);

    if (!user?.id) {
      throw new StudyOfParticipantNotFound(username, 'UserNotPresent');
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
      throw new StudyOfParticipantNotFound(username, 'GroupNotPresent');
    }

    return groups[0];
  }

  protected abstract forwardMessageToProducer(
    message: amqp.ConsumeMessage
  ): Promise<void>;
}

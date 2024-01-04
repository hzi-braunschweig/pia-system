/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakVerifyEmailEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import { MessageQueueTopic, Producer } from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';

const TARGET_TOPIC = MessageQueueTopic.PROBAND_EMAIL_VERIFIED;

export class ProbandEmailVerifiedProxy extends EventProxy {
  public pattern =
    'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.VERIFY_EMAIL';
  private _producer: Producer<unknown> | null = null;

  public set producer(value: Producer<unknown> | null) {
    this._producer = value;
  }

  public static async build(
    messageQueueService: MessageQueueService
  ): Promise<ProbandEmailVerifiedProxy> {
    const producer = await this.createProbandEmailVerifiedProducer(
      messageQueueService
    );

    const instance = new this();
    instance.producer = producer;

    return instance;
  }

  public static async createProbandEmailVerifiedProducer(
    messageQueueService: MessageQueueService
  ): Promise<Producer<unknown>> {
    return await messageQueueService.createProducer(TARGET_TOPIC);
  }

  public onMessage(
    channel: amqp.Channel
  ): (message: amqp.ConsumeMessage | null) => void {
    return (message: amqp.ConsumeMessage | null) => {
      if (!message || !this._producer) {
        return;
      }

      const json = message.content.toString();

      if (!json) {
        return;
      }

      const event = JSON.parse(json) as KeycloakVerifyEmailEvent;
      const username = (
        event.details.username as string | undefined
      )?.toLowerCase();

      if (username !== undefined) {
        this._producer
          .publish({ pseudonym: username })
          .then(() => {
            console.log(
              `Event Processed | ${this.pattern} > ${TARGET_TOPIC} | ${username}`
            );
            channel.ack(message, false);
          })
          .catch(() => {
            console.error(
              `Event Error | ${this.pattern} > ${TARGET_TOPIC} | ${username}`
            );
          });
      } else {
        console.error(
          `Event Error | ${this.pattern} > ${TARGET_TOPIC} | username is undefined`
        );
        channel.nack(message, false, false);
      }
    };
  }
}

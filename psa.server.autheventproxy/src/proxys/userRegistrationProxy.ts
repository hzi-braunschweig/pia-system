/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakRegisterEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import { MessageQueueTopic, Producer } from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';

const TARGET_TOPIC = MessageQueueTopic.PROBAND_REGISTERED;

export class UserRegistrationProxy extends EventProxy {
  public pattern =
    'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.REGISTER';
  private _producer: Producer<unknown> | null = null;

  public set producer(value: Producer<unknown> | null) {
    this._producer = value;
  }

  public static async build(
    messageQueueService: MessageQueueService
  ): Promise<UserRegistrationProxy> {
    const producer = await this.createProbandRegisteredProducer(
      messageQueueService
    );

    const instance = new this();
    instance.producer = producer;

    return instance;
  }

  public static async createProbandRegisteredProducer(
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

      const event = JSON.parse(json) as KeycloakRegisterEvent;
      const { username } = event.details;

      this._producer
        .publish({ username })
        .then(() => {
          console.log(`Event Processed | ${this.pattern} > ${TARGET_TOPIC}`);
          channel.ack(message, false);
        })
        .catch(() => {
          console.error(`Event Error | ${this.pattern} > ${TARGET_TOPIC}`);
        });
    };
  }
}

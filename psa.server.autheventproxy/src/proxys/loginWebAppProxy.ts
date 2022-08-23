/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakLoginEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import { Producer } from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';

const TARGET_TOPIC = 'proband.logged_in';

export class LoginWebAppProxy extends EventProxy {
  public pattern = 'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.LOGIN';
  private _producer: Producer<unknown> | null = null;

  public set producer(value: Producer<unknown> | null) {
    this._producer = value;
  }

  public static async build(
    messageQueueService: MessageQueueService
  ): Promise<LoginWebAppProxy> {
    const producer = await this.createProbandLoggedInProducer(
      messageQueueService
    );

    const instance = new this();
    instance.producer = producer;

    return instance;
  }

  public static async createProbandLoggedInProducer(
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

      const event = JSON.parse(json) as KeycloakLoginEvent;
      const username = event.details.username.toLowerCase();

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
    };
  }
}

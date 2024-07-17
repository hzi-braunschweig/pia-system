/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakRegisterEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import {
  MessageQueueTopic,
  Producer,
  ProbandRegisteredMessage,
} from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';
import { ProxyOnMessageError } from '../errors';

const TARGET_TOPIC = MessageQueueTopic.PROBAND_REGISTERED;

export class UserRegistrationProxy extends EventProxy {
  public pattern =
    'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.REGISTER';
  private _producer: Producer<ProbandRegisteredMessage> | null = null;

  public set producer(value: Producer<ProbandRegisteredMessage> | null) {
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
  ): Promise<Producer<ProbandRegisteredMessage>> {
    return await messageQueueService.createProducer(TARGET_TOPIC);
  }

  protected async forwardMessageToProducer(
    message: amqp.ConsumeMessage
  ): Promise<void> {
    if (!this._producer) {
      return;
    }

    const json = message.content.toString();

    if (!json) {
      return;
    }

    const event = JSON.parse(json) as KeycloakRegisterEvent;
    const { username } = event.details;

    try {
      const studyName = await this.getStudyNameOfAccountOrFail(username);

      await this._producer.publish({ username, studyName });

      console.log(
        `Event Processed | ${this.pattern} > ${TARGET_TOPIC} | ${username}`
      );
    } catch (e: unknown) {
      throw new ProxyOnMessageError(
        this.pattern,
        TARGET_TOPIC,
        e instanceof Error ? e : new Error('Unknown error')
      );
    }
  }
}

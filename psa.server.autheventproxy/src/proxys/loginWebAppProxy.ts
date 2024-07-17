/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakLoginEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import {
  MessageQueueTopic,
  Producer,
  ProbandLoggedInMessage,
} from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';
import { ProxyOnMessageError } from '../errors';

const TARGET_TOPIC = MessageQueueTopic.PROBAND_LOGGED_IN;

export class LoginWebAppProxy extends EventProxy {
  public pattern = 'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.LOGIN';
  private _producer: Producer<ProbandLoggedInMessage> | null = null;

  public set producer(value: Producer<ProbandLoggedInMessage> | null) {
    this._producer = value;
  }

  public static async build(
    messageQueueService: MessageQueueService
  ): Promise<LoginWebAppProxy> {
    const producer = await this.createProbandLoggedInProducer(
      messageQueueService
    );

    const instance = new LoginWebAppProxy();
    instance.producer = producer;

    return instance;
  }

  public static async createProbandLoggedInProducer(
    messageQueueService: MessageQueueService
  ): Promise<Producer<ProbandLoggedInMessage>> {
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

    const event = JSON.parse(json) as KeycloakLoginEvent;
    const pseudonym = event.details.username.toLowerCase();

    try {
      const studyName = await this.getStudyNameOfAccountOrFail(pseudonym);

      await this._producer.publish({ pseudonym, studyName });

      console.log(
        `Event Processed | ${this.pattern} > ${TARGET_TOPIC} | ${pseudonym}`
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new ProxyOnMessageError(this.pattern, TARGET_TOPIC, e);
      }
    }
  }
}

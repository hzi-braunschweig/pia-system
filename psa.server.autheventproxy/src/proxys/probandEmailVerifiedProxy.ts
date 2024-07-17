/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { KeycloakVerifyEmailEvent } from '../models/keycloakEvent';
import { MessageQueueService } from '../services/messageQueueService';
import {
  MessageQueueTopic,
  Producer,
  ProbandEmailVerifiedMessage,
} from '@pia/lib-messagequeue';
import { EventProxy } from './eventProxy';
import {
  PseudonymInKeycloakEventNotFound,
  ProxyOnMessageError,
} from '../errors';

const TARGET_TOPIC = MessageQueueTopic.PROBAND_EMAIL_VERIFIED;

export class ProbandEmailVerifiedProxy extends EventProxy {
  public pattern =
    'KK.EVENT.CLIENT.*.SUCCESS.pia-proband-web-app-client.VERIFY_EMAIL';
  private _producer: Producer<ProbandEmailVerifiedMessage> | null = null;

  public set producer(value: Producer<ProbandEmailVerifiedMessage> | null) {
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
  ): Promise<Producer<ProbandEmailVerifiedMessage>> {
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

    const event = JSON.parse(json) as KeycloakVerifyEmailEvent;

    try {
      const pseudonym = this.getPseudonymOrFail(event);
      const studyName = await this.getStudyNameOfAccountOrFail(pseudonym);

      await this._producer.publish({ pseudonym: pseudonym, studyName });

      console.log(
        `Event Processed | ${this.pattern} > ${TARGET_TOPIC} | ${pseudonym}`
      );
    } catch (e: unknown) {
      throw new ProxyOnMessageError(
        this.pattern,
        TARGET_TOPIC,
        e instanceof Error ? e : new Error('Unknown error')
      );
    }
  }

  private getPseudonymOrFail(event: KeycloakVerifyEmailEvent): string {
    const pseudonym = event.details.username;
    if (pseudonym === undefined) {
      throw new PseudonymInKeycloakEventNotFound('Username is undefined');
    }
    return pseudonym;
  }
}

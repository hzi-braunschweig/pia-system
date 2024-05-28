/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-magic-numbers */

import * as amqp from 'amqplib';
import { expect } from 'chai';
import { AuthEventProxyServer } from '../../../src/server';
import { KeycloakGenericEvent } from '../../../src/models/keycloakEvent';
import { ProxyTestTool } from './proxyTestTool';
import { config } from '../../../src/config';
import { createSandbox } from 'sinon';
import { afterEach } from 'mocha';
import {
  ProbandEmailVerifiedMessage,
  MessageQueueTopic,
} from '@pia/lib-messagequeue';
import { mockAuthClientResponse } from './utils';

function encodeContent(
  content: Partial<KeycloakGenericEvent> | Record<string, string>
): Buffer {
  return Buffer.from(JSON.stringify(content), 'utf-8');
}

describe('Keycloak EmailVerified Proxy', () => {
  const sandbox = createSandbox();
  const server = new AuthEventProxyServer();

  let proxyTestTool: ProxyTestTool;
  let keycloakChannel: amqp.Channel;

  before(async () => {
    await server.init();

    proxyTestTool = new ProxyTestTool();
    await proxyTestTool.connect();

    keycloakChannel = await proxyTestTool.createKeycloakChannel();
  });

  after(async () => {
    await server.stop();
    await proxyTestTool.close();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should publish new events to correct topic', async () => {
    const { channel, queue } = await proxyTestTool.createChannelWithQueue(
      MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      'email-verify'
    );
    const username = 'test-1234567890';
    const studyName = 'test study';

    mockAuthClientResponse(sandbox, username, [studyName]);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.VERIFY_EMAIL',
      username
    );

    let message: amqp.GetMessage | false = false;
    const start = Date.now();
    while (!message) {
      if (Date.now() - start > 1000) {
        throw new Error('failed to receive message within timeout');
      }
      message = await channel.get(queue.queue);
    }

    const content = JSON.parse(
      (message as unknown as amqp.ConsumeMessage).content.toString()
    ) as {
      message: ProbandEmailVerifiedMessage;
    };

    expect(content).to.have.property('message');
    expect(content.message).to.have.property('pseudonym');
    expect(content.message.pseudonym).to.equal(username);
    expect(content.message.studyName).to.equal(studyName);
  });

  it('should not publish an event if the study was determinable', async () => {
    const { channel, queue } = await proxyTestTool.createChannelWithQueue(
      MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      'email-verify'
    );

    const errorLogSpy = sandbox.spy(console, 'error');

    mockAuthClientResponse(sandbox);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.VERIFY_EMAIL',
      'test-1234567890'
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(errorLogSpy.calledOnce).to.be.true;
    expect(await channel.get(queue.queue)).to.be.false;
  });

  it('should not publish an event if the message does not contain a username', async () => {
    const { channel, queue } = await proxyTestTool.createChannelWithQueue(
      MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
      'email-verify'
    );

    const errorLogSpy = sandbox.spy(console, 'error');
    const messagePromise = channel.get(queue.queue);

    mockAuthClientResponse(sandbox);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.VERIFY_EMAIL',
      undefined
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const message = await messagePromise;
    expect(errorLogSpy.calledOnce).to.be.true;
    expect(message).to.be.false;
  });

  function publishKeycloakRegisterEvent(
    routingKey: string,
    username: string | undefined
  ): void {
    keycloakChannel.publish(
      config.servers.authserver.messageQueueExchange,
      routingKey,
      encodeContent({
        details: {
          username: username as unknown as string,
        },
      })
    );
  }
});

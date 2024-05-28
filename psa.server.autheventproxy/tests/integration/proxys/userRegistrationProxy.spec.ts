/* eslint-disable @typescript-eslint/no-magic-numbers */
/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as amqp from 'amqplib';
import { expect } from 'chai';
import { AuthEventProxyServer } from '../../../src/server';
import { KeycloakGenericEvent } from '../../../src/models/keycloakEvent';
import { ProxyTestTool } from './proxyTestTool';
import { config } from '../../../src/config';
import { createSandbox } from 'sinon';
import { afterEach } from 'mocha';
import { mockAuthClientResponse } from './utils';
import {
  MessageQueueTopic,
  ProbandRegisteredMessage,
} from '@pia/lib-messagequeue';

function encodeContent(
  content: Partial<KeycloakGenericEvent> | Record<string, string>
): Buffer {
  return Buffer.from(JSON.stringify(content), 'utf-8');
}

describe('Keycloak Registration Proxy', () => {
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
      MessageQueueTopic.PROBAND_REGISTERED,
      'web-app-registered'
    );

    const username = 'test-1234567890';
    const studyName = 'test study';

    mockAuthClientResponse(sandbox, username, [studyName]);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.REGISTER',
      username,
      'test@localhost'
    );

    await expectRegisterEvent(channel, queue, username, studyName);
  });

  it('should not publish an event if the study was determinable', async () => {
    const { channel, queue } = await proxyTestTool.createChannelWithQueue(
      MessageQueueTopic.PROBAND_REGISTERED,
      'web-app-registered'
    );

    const errorLogSpy = sandbox.spy(console, 'error');

    mockAuthClientResponse(sandbox);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.REGISTER',
      'test-1234567890',
      'test@localhost'
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(errorLogSpy.calledOnce).to.be.true;
    expect(await channel.get(queue.queue)).to.be.false;
  });

  it('should not publish an event if the message does not contain a username', async () => {
    const { channel, queue } = await proxyTestTool.createChannelWithQueue(
      MessageQueueTopic.PROBAND_REGISTERED,
      'web-app-registered'
    );

    const errorLogSpy = sandbox.spy(console, 'error');
    const messagePromise = channel.get(queue.queue);

    mockAuthClientResponse(sandbox);

    publishKeycloakRegisterEvent(
      'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.REGISTER',
      undefined,
      undefined
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const message = await messagePromise;
    expect(errorLogSpy.calledOnce).to.be.true;
    expect(message).to.be.false;
  });

  async function expectRegisterEvent(
    channel: amqp.Channel,
    queue: amqp.Replies.AssertQueue,
    username: string,
    studyName: string
  ): Promise<void> {
    return new Promise((resolve) => {
      void channel.consume(queue.queue, (message) => {
        const content = JSON.parse(message?.content.toString() ?? '') as {
          message: ProbandRegisteredMessage;
        };

        expect(content).to.have.property('message');
        expect(content.message).to.have.property('username');
        expect(content.message.username).to.equal(username);
        expect(content.message.studyName).to.equal(studyName);

        resolve();
      });
    });
  }

  function publishKeycloakRegisterEvent(
    routingKey: string,
    username: string,
    email: string
  ): void {
    keycloakChannel.publish(
      config.servers.authserver.messageQueueExchange,
      routingKey,
      encodeContent({
        details: { username, email },
      })
    );
  }
});

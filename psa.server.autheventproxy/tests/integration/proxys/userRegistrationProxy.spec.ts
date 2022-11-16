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

function encodeContent(
  content: Partial<KeycloakGenericEvent> | Record<string, string>
): Buffer {
  return Buffer.from(JSON.stringify(content), 'utf-8');
}

describe('Keycloak Registration Proxy', () => {
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

  describe('Register', () => {
    it('should publish new events to correct topic', async () => {
      const { channel, queue } = await proxyTestTool.createChannelWithQueue(
        'proband.registered',
        'web-app-registered'
      );

      publishKeycloakRegisterEvent(
        'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.REGISTER'
      );

      await expectRegisterEvent(channel, queue);
    });
  });

  async function expectRegisterEvent(
    channel: amqp.Channel,
    queue: amqp.Replies.AssertQueue
  ): Promise<void> {
    return new Promise((resolve) => {
      void channel.consume(queue.queue, (message) => {
        const content = JSON.parse(message?.content.toString() ?? '') as {
          message: { username: string; email: string };
        };

        expect(content).to.have.property('message');
        expect(content.message).to.have.property('username');
        expect(content.message.username).to.equal('test-1234567890');

        resolve();
      });
    });
  }

  function publishKeycloakRegisterEvent(routingKey: string): void {
    keycloakChannel.publish(
      config.servers.authserver.messageQueueExchange,
      routingKey,
      encodeContent({
        details: {
          username: 'test-1234567890',
          email: 'test@localhost',
        },
      })
    );
  }
});

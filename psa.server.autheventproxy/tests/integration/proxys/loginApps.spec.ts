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

describe('Keycloak Login Proxies', () => {
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

  describe('Login Web App', () => {
    it('should publish new events to correct topic with lowercase pseudonym', async () => {
      const { channel, queue } = await proxyTestTool.createChannelWithQueue(
        'proband.logged_in',
        'web-app'
      );

      publishKeycloakLoginEvent(
        'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.LOGIN'
      );

      await expectProbandLoggedInEvent(channel, queue);
    });
  });

  describe('Login Mobile App', () => {
    it('should publish new events to correct topic with lowercase pseudonym', async () => {
      const { channel, queue } = await proxyTestTool.createChannelWithQueue(
        'proband.logged_in',
        'mobile-app'
      );

      publishKeycloakLoginEvent(
        'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-mobile-app-client.LOGIN'
      );

      await expectProbandLoggedInEvent(channel, queue);
    });
  });

  async function expectProbandLoggedInEvent(
    channel: amqp.Channel,
    queue: amqp.Replies.AssertQueue
  ): Promise<void> {
    return new Promise((resolve) => {
      void channel.consume(queue.queue, (message) => {
        const content = JSON.parse(message?.content.toString() ?? '') as {
          message: { pseudonym: string };
        };

        expect(content).to.have.property('message');
        expect(content.message).to.have.property('pseudonym');
        // ensure pseudonyms are normalized to lower case, as they exist in database
        expect(content.message.pseudonym).to.equal('test-1234567890');

        resolve();
      });
    });
  }

  function publishKeycloakLoginEvent(routingKey: string): void {
    keycloakChannel.publish(
      config.servers.authserver.messageQueueExchange,
      routingKey,
      encodeContent({
        details: {
          username: 'TEST-1234567890',
        },
      })
    );
  }
});

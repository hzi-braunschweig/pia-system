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
import {
  ProbandLoggedInMessage,
  MessageQueueTopic,
} from '@pia/lib-messagequeue';
import { mockAuthClientResponse } from './utils';

function encodeContent(
  content: Partial<KeycloakGenericEvent> | Record<string, string>
): Buffer {
  return Buffer.from(JSON.stringify(content), 'utf-8');
}

describe('Keycloak Login Proxies', () => {
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

  describe('Login Web App', () => {
    it('should publish new events to correct topic with lowercase pseudonym', async () => {
      const { channel, queue } = await proxyTestTool.createChannelWithQueue(
        MessageQueueTopic.PROBAND_LOGGED_IN,
        'web-app'
      );
      const username = 'test-1234567890';
      const studyName = 'test study';

      mockAuthClientResponse(sandbox, username, [studyName]);

      publishKeycloakLoginEvent(
        'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-web-app-client.LOGIN',
        username.toUpperCase()
      );

      await expectProbandLoggedInEvent(channel, queue, username, studyName);
    });
  });

  describe('Login Mobile App', () => {
    it('should publish new events to correct topic with lowercase pseudonym', async () => {
      const { channel, queue } = await proxyTestTool.createChannelWithQueue(
        MessageQueueTopic.PROBAND_LOGGED_IN,
        'mobile-app'
      );
      const username = 'test-1234567890';
      const studyName = 'test study';

      mockAuthClientResponse(sandbox, username, [studyName]);

      publishKeycloakLoginEvent(
        'KK.EVENT.CLIENT.foo-bar.SUCCESS.pia-proband-mobile-app-client.LOGIN',
        username.toUpperCase()
      );

      await expectProbandLoggedInEvent(channel, queue, username, studyName);
    });
  });

  async function expectProbandLoggedInEvent(
    channel: amqp.Channel,
    queue: amqp.Replies.AssertQueue,
    username: string,
    studyName: string
  ): Promise<void> {
    return new Promise((resolve) => {
      void channel.consume(queue.queue, (message) => {
        const content = JSON.parse(message?.content.toString() ?? '') as {
          message: ProbandLoggedInMessage;
        };

        expect(content).to.have.property('message');
        expect(content.message).to.have.property('pseudonym');
        // ensure pseudonyms are normalized to lower case, as they exist in database
        expect(content.message.pseudonym).to.equal(username);
        expect(content.message.studyName).to.equal(studyName);

        resolve();
      });
    });
  }

  function publishKeycloakLoginEvent(
    routingKey: string,
    username: string
  ): void {
    keycloakChannel.publish(
      config.servers.authserver.messageQueueExchange,
      routingKey,
      encodeContent({ details: { username } })
    );
  }
});

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as sinon from 'sinon';
import { IDatabase } from 'pg-promise';
import EventEmitter from 'events';
import { expect } from 'chai';
import { mock } from 'ts-mockito';

import { ListeningDbClient } from './listeningDbClient';

describe('ListeningDbClient', () => {
  let client: { client: EventEmitter; done: sinon.SinonStub };
  let db: IDatabase<unknown>;
  let connectStub: sinon.SinonStub;
  let listeningDbClient: ListeningDbClient<unknown>;
  let onLostCallback: (err: unknown) => Promise<void>;

  beforeEach(() => {
    client = { client: new EventEmitter(), done: sinon.stub() };
    db = mock<IDatabase<unknown>>();
    connectStub = sinon
      .stub()
      .callsFake(
        async ({ onLost }: { onLost: (err: unknown) => Promise<void> }) => {
          onLostCallback = onLost;
          return Promise.resolve(client);
        }
      );
    db.connect = connectStub;
    listeningDbClient = new ListeningDbClient<unknown>(db);
  });

  afterEach(() => {
    // reset callback to avoid pollution of tests which do not execute the connect() method
    onLostCallback = async (): Promise<void> => Promise.resolve();
  });

  describe('connect()', () => {
    it('should connect to the db', async () => {
      await listeningDbClient.connect();
      expect(connectStub.calledOnce).to.be.true;
      expect(onLostCallback).not.to.be.undefined;
    });

    it('should retry if it could not connect', async () => {
      const expectedCallCount = 4;
      let retryCount = 3;
      connectStub = sinon
        .stub()
        .callsFake(
          async ({ onLost }: { onLost: (err: unknown) => Promise<void> }) => {
            if (retryCount > 0) {
              retryCount--;
              return Promise.reject();
            }
            onLostCallback = onLost;
            return Promise.resolve(client);
          }
        );
      db.connect = connectStub;
      listeningDbClient = new ListeningDbClient<unknown>(db);
      await listeningDbClient.connect();
      expect(connectStub.callCount).to.eq(expectedCallCount);
    });

    it('should disconnect on connection lost', async () => {
      const disconnectStub = sinon
        .stub(listeningDbClient, 'disconnect')
        .callThrough();
      await listeningDbClient.connect();
      await onLostCallback('could not connect to db');
      expect(disconnectStub.calledOnce).to.be.true;
    });

    it('should register an error event listener', async () => {
      expect(client.client.listenerCount('error')).to.eql(0);
      await listeningDbClient.connect();
      expect(client.client.listenerCount('error')).to.eql(1);
      client.client.emit('error');
    });
  });

  describe('disconnect()', () => {
    it('should close the connection and remove event listeners', async () => {
      await listeningDbClient.connect();
      client.client.on('db_event', () => null);
      expect(client.client.listenerCount('db_event')).to.eql(1);
      await listeningDbClient.disconnect();
      expect(client.done.calledOnce).to.be.true;
      expect(client.client.listenerCount('db_event')).to.eql(0);
    });

    it('should not do anything if it was already disconnected', async () => {
      await listeningDbClient.disconnect();
      expect(client.done.notCalled).to.be.true;
    });
  });
});

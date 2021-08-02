/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import utils from 'util';
import EventEmitter from 'events';
import { IConnected, IDatabase } from 'pg-promise';
import * as pg from 'pg-promise/typescript/pg-subset';

const sleep = utils.promisify(setTimeout);

/**
 * An Instance of this class uses the pg-promise to connect to the DB and keep the connection.
 * If the connection cannot be established, it tries again and again every second.
 * For the client is invalid, when the connection breaks it sends an event, when a new client is created.
 * To register a DB-listening-function, you must register the function everytime a new client is available.
 */
export class ListeningDbClient<
  Ext,
  C extends pg.IClient = pg.IClient
> extends EventEmitter {
  private sco: IConnected<Ext, C> | null = null;

  private disconnected = false;
  private readonly TIME_TO_WAIT_BEFORE_RETRY = 1000;

  /**
   * Creates the new ListeningDbClient using the given pg-promise db object
   */
  public constructor(private readonly db: IDatabase<Ext, C>) {
    super();
  }

  /**
   * May also be called on connection lost
   * @param err Unexpected error
   */
  private static onError(err: Error): void {
    console.error('Unexpected error on listening client.', err);
  }

  /**
   * Creates a new connection to the db. The promise will only be resolved,
   * when a connection could be established or when the disconnect method is called.
   */
  public async connect(): Promise<void> {
    this.disconnected = false;
    // (could be changed asynchronously)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (!this.sco && !this.disconnected) {
      try {
        this.sco = await this.db.connect({
          onLost: async (err) => this.onConnectionLost(err),
        });
      } catch (err) {
        console.error(
          'Could not connect to DB. I will try again in a second.',
          err
        );
        await sleep(this.TIME_TO_WAIT_BEFORE_RETRY);
      }
    }
    // (could be changed asynchronously)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.disconnected && this.sco) {
      // if connecting doesn't work it is possible to disconnect and break up the loop
      // in this case, sco would still be null
      this.sco.client.on('error', (err) => ListeningDbClient.onError(err));
      console.log('Connected to DB');
      this.emit('connected', this.sco.client);
    }
  }

  /**
   * Disconnects the current connection if there is any.
   * @return {Promise<void>}
   */
  public async disconnect(): Promise<void> {
    this.disconnected = true;
    if (this.sco) {
      await this.sco.done();
      this.sco.client.removeAllListeners();
      this.sco = null;
    } else {
      console.warn('Could not disconnect as no DB client exists');
    }
  }

  /**
   * Cleans up the closed connection and tries to reconnect.
   * @private
   * @param err Connection lost error
   */
  private async onConnectionLost(err: unknown): Promise<void> {
    console.error('Connection lost on listening client.', err);
    await this.disconnect();
    console.error('reconnecting...');
    await this.connect();
  }
}

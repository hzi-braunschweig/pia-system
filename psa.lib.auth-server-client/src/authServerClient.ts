/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { promisify } from 'util';
import { EventEmitter, once } from 'events';
import { assert } from 'ts-essentials';
import { StatusCodes } from 'http-status-codes';

const MILLI_PER_SECOND = 1000;
const FIFE_SECONDS = 5;

export interface AuthServerClientSettings {
  /**
   * The Keycloak connection
   */
  connection: { url: string };

  /**
   * ID of the Keycloak realm
   */
  realm: string;

  /**
   * Identifier of the Keycloak client
   */
  clientId: string;

  /**
   * Related secret of the Keycloak client
   */
  secret: string;
}

export class AuthServerClient extends KcAdminClient {
  public readonly connectionEvents = new EventEmitter();
  public readonly realm: string;
  private waitForConnection: Promise<unknown> | undefined = undefined;
  private currentInterval: ReturnType<typeof setInterval> | undefined;
  private connected = false;

  /**
   * The access token lifespan that controls when it should be refreshed.
   * It will be overwritten by the real lifespan of the token (-5 seconds as a buffer).
   * @example lifespan = exp - iat = 300 seconds => 295000 milliseconds
   * @default 5 seconds
   * @private
   */
  private accessTokenLifespan = FIFE_SECONDS * MILLI_PER_SECOND;

  public constructor(
    private readonly clientSettings: AuthServerClientSettings,
    private readonly reconnectInterval = MILLI_PER_SECOND
  ) {
    super({
      baseUrl: clientSettings.connection.url,
      realmName: clientSettings.realm,
    });
    this.realm = clientSettings.realm;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Connect this client to keycloak and start connection handling.
   * If the connection is lost it tries to reconnect.
   * If the connection is established it refreshes the token before it expires.
   */
  public connect(): void {
    if (!this.waitForConnection) {
      this.waitForConnection = once(this.connectionEvents, 'connected');
      this.initConnectionHandling();
      this.authenticate()
        .then(() => {
          this.connectionEvents.emit('connected');
        })
        .catch((e) => {
          if (e instanceof Error) {
            console.error(
              'first attempt to connect to keycloak failed with this reason:',
              e.message
            );
          }
          this.connectionEvents.emit('connection_lost');
        });
    }
  }

  /**
   * Stops the connection handling.
   * The token will not be refreshed again and any background task for that will be stopped.
   */
  public disconnect(): void {
    this.connectionEvents.removeAllListeners();
    this.waitForConnection = undefined;
    this.resetInterval();
  }

  public async waitForServer(): Promise<void> {
    this.connect();
    await this.waitForConnection;
    await this.waitForRealm();
  }

  private async authenticate(): Promise<void> {
    await this.auth({
      grantType: 'client_credentials',
      clientId: this.clientSettings.clientId,
      clientSecret: this.clientSettings.secret,
    });
    const tokenPart = this.accessToken?.split('.')[1];
    let tokenLifespanInSeconds = 0;
    if (tokenPart) {
      const tokenPayload = JSON.parse(
        Buffer.from(tokenPart, 'base64').toString()
      ) as Record<string, string | number>;
      if (
        typeof tokenPayload['exp'] === 'number' &&
        typeof tokenPayload['iat'] === 'number'
      ) {
        // the token should be refreshed 5 seconds before it expires
        tokenLifespanInSeconds =
          tokenPayload['exp'] - tokenPayload['iat'] - FIFE_SECONDS;
      }
    }
    if (tokenLifespanInSeconds < FIFE_SECONDS) {
      this.accessTokenLifespan = FIFE_SECONDS * MILLI_PER_SECOND;
      console.warn(
        'Token lifespan is very short or exp and iat is missing in token. Refresh is set to 5 seconds.'
      );
    } else {
      this.accessTokenLifespan = tokenLifespanInSeconds * MILLI_PER_SECOND;
    }
  }

  private resetInterval(): void {
    if (this.currentInterval) {
      clearInterval(this.currentInterval);
    }
    this.currentInterval = undefined;
  }

  private initConnectionHandling(): void {
    this.connectionEvents.on('connection_lost', () => {
      console.warn('lost connection to keycloak');
      this.connected = false;
      try {
        this.reconnect();
      } catch (e) {
        console.error(e);
      }
    });
    this.connectionEvents.on('connected', () => {
      console.info('connected to keycloak');
      this.connected = true;
      try {
        this.initRenewTokenHandling();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private reconnect(): void {
    assert(this.currentInterval === undefined);
    this.waitForConnection = once(this.connectionEvents, 'connected');
    this.currentInterval = setInterval(() => {
      this.authenticate()
        .then(() => {
          this.resetInterval();
          this.connectionEvents.emit('connected');
        })
        .catch(() => {
          console.warn('waiting for keycloak to be started...');
        });
    }, this.reconnectInterval);
  }

  private initRenewTokenHandling(): void {
    assert(this.currentInterval === undefined);
    this.currentInterval = setInterval(() => {
      this.authenticate().catch(() => {
        this.resetInterval();
        this.connectionEvents.emit('connection_lost');
      });
    }, this.accessTokenLifespan);
  }

  private async waitForRealm(): Promise<void> {
    const sleep = promisify(setTimeout);
    for (;;) {
      try {
        await this.realms.findOne({
          realm: this.clientSettings.realm,
        });
        break;
      } catch (e) {
        console.warn(`waiting for keycloak realm creation to be finished...`);
        /**
         * In certain circumstances (execution in CI pipeline) the token
         * which was returned after the first authenticate is not valid.
         * We fix this by simply authenticating again. The actual underlying
         * problem is not yet known.
         */
        if (
          (e as { response?: { status?: number } }).response?.status ===
          StatusCodes.FORBIDDEN
        ) {
          await this.authenticate();
        } else {
          console.error(e);
        }
        await sleep(this.reconnectInterval);
      }
    }
  }
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Server {
  init(): Promise<void>;
  stop(): Promise<void>;
  terminate?(): Promise<void>;
}

export class ServerRunner {
  public constructor(private readonly server: Server) {}

  public start(): void {
    this.init().catch((err) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.error('Could not start the server:', err);
      process.exit(1);
    });

    const stop = (): void => {
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);

      console.log('SIGINT/SIGTERM received -> cleaning up...');

      this.stop().catch((err) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        console.error('Could not stop the server gracefully:', err);
        process.exit(1);
      });
    };

    process.addListener('SIGINT', stop);
    process.addListener('SIGTERM', stop);
  }

  private async init(): Promise<void> {
    await this.server.init();
    console.info('Server started');
  }

  private async stop(): Promise<void> {
    await this.server.stop();
    console.info('Server stopped');

    if (this.server.terminate) {
      await this.server.terminate();
      console.info('terminate completed');
    }
  }
}

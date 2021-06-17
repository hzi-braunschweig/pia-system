import Hapi from '@hapi/hapi';

import { registerAuthStrategies, registerPlugins } from '../../src';
import { config } from './config';

export class Server {
  public static instance: Hapi.Server | undefined;

  public static async init(): Promise<void> {
    Server.instance = new Hapi.Server({
      host: config.public.host,
      port: config.public.port,
      routes: {
        cors: { origin: ['*'] },
        timeout: {
          socket: false,
          server: false,
        },
      },
      app: {
        healthcheck: async (): Promise<boolean> => {
          return Promise.resolve(true);
        },
      },
    });

    await registerAuthStrategies(Server.instance, {
      strategies: ['jwt', 'simple'],
      publicAuthKey: config.publicAuthKey,
      basicCredentials: {
        username: 'basicuser',
        password: 'basicpassword',
      },
    });
    await registerPlugins(Server.instance, {
      name: 'exampleservice',
      version: '1.0.0',
      routes: './tests/example-service/routes/*.ts',
    });

    await Server.instance.start();
    Server.instance.log(
      ['startup'],
      `Server running at ${Server.instance.info.uri}`
    );
  }

  public static async stop(): Promise<void> {
    await Server.instance?.stop();
    Server.instance?.log(['startup'], `Server was stopped`);
  }
}

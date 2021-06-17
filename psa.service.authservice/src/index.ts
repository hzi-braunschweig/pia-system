import * as server from './server';
import { ServerRunner } from '@pia/lib-service-core';

new ServerRunner(server).start();

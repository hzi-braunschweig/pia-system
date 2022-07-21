import { Server } from '@hapi/hapi';
import { AuthSettings } from '../config/configModel';
export declare function registerAuthStrategies(server: Server, authSettings: AuthSettings): Promise<void>;

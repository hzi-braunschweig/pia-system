import { Server } from '@hapi/hapi';
export interface ServicePluginOptions {
    name: string;
    version: string;
    routes?: string;
    isInternal?: boolean;
}
export declare const registerPlugins: (server: Server, options: ServicePluginOptions) => Promise<void>;

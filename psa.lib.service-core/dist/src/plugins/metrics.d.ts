import { Plugin } from '@hapi/hapi';
declare module '@hapi/hapi' {
    interface ServerOptionsApp {
        healthcheck?: () => Promise<boolean>;
    }
}
export declare const Metrics: Plugin<unknown>;

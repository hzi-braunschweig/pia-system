import { Plugin } from '@hapi/hapi';
declare module '@hapi/hapi' {
    interface RouteOptionsApp {
        assertStudyAccess?: boolean;
    }
}
export declare const AssertStudyAccess: Plugin<unknown>;

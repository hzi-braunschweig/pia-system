export declare class LicenseTextCompleter {
    static APACHE_LICENSE_2_0: string;
    static GPL_2_0: string;
    static GPL_3_0: string;
    static LGPL_3_0: string;
    static MIT_ANGULAR: string;
    static MIT_IONIC: string;
    static MIT_ZENO_ROCHA: string;
    static knownMissingLicenseTexts: Map<string, string> | undefined;
    private static initialize;
    static init(): Promise<void>;
    static has(packageName: string): boolean;
    static get(packageName: string): string | undefined;
    private static runInit;
    private static fetchLicenses;
    private static createLicenseMap;
}

import { PackageLicense } from './packageLicense';
export declare class LicenseCollector {
    private static readonly LICENSE_WHITELIST_PROD;
    private static readonly LICENSE_WHITELIST_PROD_AND_DEV;
    static collectLicenses(rootDir: string, excludePackages: string | undefined, onlyProduction: boolean, assertValidLicenseTexts?: boolean): Promise<PackageLicense[]>;
    private static getOwnName;
    private static getModulePathsIn;
    private static getLicenseEntries;
}

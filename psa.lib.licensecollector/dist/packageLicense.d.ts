export declare class PackageLicense {
    readonly packageName: string;
    readonly licenses: string | string[];
    licenseText: string;
    repository?: string | undefined;
    static readonly EMPTY_LICENSE_TEXT_PLACEHOLDER = "license text not found";
    private static readonly VALID_LICENSE_TEXT_SNIPPETS;
    constructor(packageName: string, licenses: string | string[], licenseText: string, repository?: string | undefined);
    getHash(): string;
    assertLicenseTextIsValid(): void;
    private getKnownMissingLicenseText;
}

#!/usr/bin/env node
export interface CommandOptions {
    target: string;
    excludePackages?: string;
    onlyProduction: boolean;
    assertValidLicenseTexts: boolean;
    format: 'text' | 'json';
    addDocker: boolean;
}

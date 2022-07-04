"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageLicense = void 0;
const licenseTextCompleter_1 = require("./licenseTextCompleter");
const crypto_1 = __importDefault(require("crypto"));
class PackageLicense {
    constructor(packageName, licenses, licenseText, repository) {
        this.packageName = packageName;
        this.licenses = licenses;
        this.licenseText = licenseText;
        this.repository = repository;
        this.licenseText = this.getKnownMissingLicenseText();
    }
    getHash() {
        return crypto_1.default
            .createHash('md5')
            .update(this.packageName)
            .update(this.licenses.toString())
            .update(this.licenseText)
            .digest('hex');
    }
    assertLicenseTextIsValid() {
        if (!(this.licenseText !== PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER &&
            PackageLicense.VALID_LICENSE_TEXT_SNIPPETS.some((snippet) => this.licenseText.includes(snippet)))) {
            throw new Error('Could not find a valid license text for package "' +
                this.packageName +
                '" with text:\n\n' +
                this.licenseText +
                '\n\n' +
                'Please add a valid license text to licenseTextCompleter.ts\n\n');
        }
    }
    getKnownMissingLicenseText() {
        let licenseText;
        if (licenseTextCompleter_1.LicenseTextCompleter.has(this.packageName)) {
            licenseText = licenseTextCompleter_1.LicenseTextCompleter.get(this.packageName);
        }
        else {
            licenseText = this.licenseText;
        }
        return licenseText;
    }
}
exports.PackageLicense = PackageLicense;
PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER = 'license text not found';
PackageLicense.VALID_LICENSE_TEXT_SNIPPETS = [
    'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION',
    'Licensed under the Apache License, Version 2.0 (the "License")',
    'The MIT License (MIT)',
    'Permission is hereby granted, free of charge',
    'Permission to use, copy, modify, and/or distribute',
    'Redistribution and use in source and binary forms, with or',
    'Anyone is free to copy, modify, publish, use, compile, sell, or',
    'DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE',
    'Attribution 4.0 International',
    'CC0 1.0 Universal',
    'Mozilla Public License, version 2.0',
];
//# sourceMappingURL=packageLicense.js.map
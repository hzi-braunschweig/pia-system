/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LicenseTextCompleter } from './licenseTextCompleter';
import crypto from 'crypto';

export class PackageLicense {
  public static readonly EMPTY_LICENSE_TEXT_PLACEHOLDER =
    'license text not found';

  private static readonly VALID_LICENSE_TEXT_SNIPPETS = [
    // Apache
    'TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION',
    'Licensed under the Apache License, Version 2.0 (the "License")',
    // MIT
    'The MIT License (MIT)',
    'Permission is hereby granted, free of charge',
    // ISC
    'Permission to use, copy, modify, and/or distribute',
    // BSD
    'Redistribution and use in source and binary forms, with or',
    // Unlicense
    'Anyone is free to copy, modify, publish, use, compile, sell, or',
    // WTFPL
    'DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE',
  ];

  public constructor(
    public readonly packageName: string,
    public readonly licenses: string | string[],
    public licenseText: string,
    public repository?: string | undefined
  ) {
    this.licenseText = this.getKnownMissingLicenseText();
  }

  public getHash(): string {
    return crypto
      .createHash('md5')
      .update(this.packageName)
      .update(this.licenses.toString())
      .update(this.licenseText)
      .digest('hex');
  }

  public assertLicenseTextIsValid(): void {
    if (
      !(
        this.licenseText !== PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER &&
        PackageLicense.VALID_LICENSE_TEXT_SNIPPETS.some((snippet) =>
          this.licenseText.includes(snippet)
        )
      )
    ) {
      throw new Error(
        'Could not find a valid license text for package "' +
          this.packageName +
          '" with text:\n\n' +
          this.licenseText +
          '\n\n' +
          'Please add a valid license text to known-missing-license-texts.js\n\n'
      );
    }
  }

  private getKnownMissingLicenseText(): string {
    let licenseText;
    if (LicenseTextCompleter.has(this.packageName)) {
      licenseText = LicenseTextCompleter.get(this.packageName)!;
    } else {
      licenseText = this.licenseText;
    }
    return licenseText;
  }
}

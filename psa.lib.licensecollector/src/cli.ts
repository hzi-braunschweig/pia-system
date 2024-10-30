#!/usr/bin/env node

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import fs from 'fs/promises';
import { Argument, Command, Option } from 'commander';
import { LicenseCollector } from './licenseCollector';
import { getDockerLicenses } from './dockerLicenseTexts';
import { getAdditionalLicenses } from './additionalLicenseTexts';
import { PackageLicense } from './packageLicense';
import { asyncPassErrors } from './asyncWithErrors';

export interface CommandOptions {
  target: string;
  excludePackages?: string;
  onlyProduction: boolean;
  assertValidLicenseTexts: boolean;
  format: 'text' | 'json';
  addDocker: boolean;
}

class Program {
  public static async main(): Promise<void> {
    const program = new Command();

    program
      .description('Creating files with license information')
      .addOption(
        new Option(
          '-t, --target <target>',
          'The path where to save the licenses'
        ).default('./THIRD_PARTY_LICENSES')
      )
      .addOption(
        new Option(
          '-e, --excludePackages <excludePackages>',
          "You can specify a list of packages separated by ';'"
        )
      )
      .addOption(
        new Option(
          '-p, --onlyProduction',
          'Use this option, if you only want to include production dependencies'
        )
      )
      .addOption(
        new Option(
          '-a, --assertValidLicenseTexts',
          'Use this option, if you want the license collector also to check that ' +
            "every license has a valid license text - the job fails if it doesn't"
        )
      )
      .addOption(
        new Option(
          '-f, --format <format>',
          'Select whether to get a json or plain text output'
        )
          .choices(['json', 'text'])
          .default('text')
      )
      .addOption(
        new Option(
          '-d, --addDocker',
          'Add additional Docker licenses stored fix in this lib'
        )
      )
      .addArgument(
        new Argument(
          '[root]',
          'Set the root directory, that should be scanned'
        ).default('./', 'current directory')
      )
      .action(
        asyncPassErrors(async (root: string, options: CommandOptions) => {
          const licenses = await LicenseCollector.collectLicenses(
            root,
            options.excludePackages,
            options.onlyProduction,
            options.assertValidLicenseTexts
          );
          if (options.addDocker) {
            licenses.push(...getDockerLicenses());
          }
          licenses.push(...getAdditionalLicenses());
          licenses.sort((a, b) => {
            return a.packageName === b.packageName
              ? 0
              : a.packageName > b.packageName
              ? 1
              : -1;
          });
          switch (options.format) {
            case 'text':
              await fs.writeFile(
                options.target,
                this.createLicenseTextFile(licenses)
              );
              break;
            case 'json':
              await fs.writeFile(options.target, JSON.stringify({ licenses }));
              break;
          }
        })
      );
    await program.parseAsync();
  }

  private static createLicenseTextFile(licenses: PackageLicense[]): string {
    let thirdPartyLicenses = '';
    for (const license of licenses) {
      const repo = license.repository ? ' [' + license.repository + ']' : '';
      thirdPartyLicenses +=
        '################################################################################\n' +
        `# ${license.packageName} (${license.licenses.toString()})${repo}\n` +
        '################################################################################\n\n' +
        `${this.removeCarriageReturns(license.licenseText)}` +
        '\n\n';
    }
    return thirdPartyLicenses;
  }

  private static removeCarriageReturns(licenseText: string): string {
    return licenseText.replace(/\r/g, '');
  }
}

void Program.main();

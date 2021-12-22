/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'fs/promises';
import path from 'path';
import * as util from 'util';
import { init, ModuleInfos } from 'license-checker';
import { PackageLicense } from './packageLicense';
import { LicenseTextCompleter } from './licenseTextCompleter';

const getLicenses = util.promisify(init);

export class LicenseCollector {
  /**
   * You may add other permissive licenses but this needs
   * to be double checked first!
   */
  private static readonly LICENSE_WHITELIST_PROD = [
    '0BSD',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BSD',
    'CC-BY-3.0',
    'CC-BY-4.0',
    'CC0-1.0',
    'ISC',
    'MIT',
    'Unlicense',
    'WTFPL',
  ];

  private static readonly LICENSE_WHITELIST_PROD_AND_DEV = [
    ...LicenseCollector.LICENSE_WHITELIST_PROD,
    'Apache 2.0',
    'CC-BY-4.0',
    'Custom',
    'EUPL-1.1',
    'Python-2.0',
    'Artistic-2.0',
  ];

  public static async collectLicenses(
    rootDir: string,
    excludePackages: string | undefined,
    onlyProduction: boolean,
    assertValidLicenseTexts = false
  ): Promise<PackageLicense[]> {
    await LicenseTextCompleter.init();
    const modulePathsAsync = LicenseCollector.getModulePathsIn(
      path.resolve(rootDir)
    );

    const modulePaths: string[] = [];
    const ownPackages: string[] = [];
    for await (const modulePath of modulePathsAsync) {
      const packageName = await LicenseCollector.getOwnName(modulePath);
      ownPackages.push(packageName);
      modulePaths.push(modulePath);
    }

    const moduleInfosList: ModuleInfos[] = [];
    for (const modulePath of modulePaths) {
      try {
        const moduleInfos = await getLicenses({
          start: modulePath,
          production: onlyProduction,
          // filter own packages
          excludePackages: [...ownPackages, excludePackages].join(';'),
          // fail if license is not supported
          onlyAllow: (onlyProduction
            ? this.LICENSE_WHITELIST_PROD
            : this.LICENSE_WHITELIST_PROD_AND_DEV
          ).join(';'),
          customFormat: {
            name: '',
            repository: undefined,
            licenses: '',
            licenseText: PackageLicense.EMPTY_LICENSE_TEXT_PLACEHOLDER,
          },
        });
        moduleInfosList.push(moduleInfos);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'No packages found in this path..') {
            console.log(
              `There was a package.json in '${modulePath}' but no packages where found in this path.`
            );
          } else if (err.message.includes('--onlyAllow')) {
            throw new Error(err.toString());
          } else {
            console.error(err);
          }
        } else {
          console.error(err);
        }
      }
    }
    const allLicenses = new Map<string, PackageLicense>();
    moduleInfosList.forEach((moduleInfos) => {
      const licenses = LicenseCollector.getLicenseEntries(moduleInfos);
      if (assertValidLicenseTexts) {
        licenses.forEach((license) => {
          license.assertLicenseTextIsValid();
        });
      }
      licenses.forEach((license) => {
        allLicenses.set(license.getHash(), license);
      });
    });
    return [...allLicenses.values()];
  }

  private static async getOwnName(rootPath: string): Promise<string> {
    const packageInfos = JSON.parse(
      await fs.readFile(path.join(rootPath, 'package.json'), {
        encoding: 'utf-8',
      })
    ) as { name: string; version: string };
    return packageInfos.name + '@' + packageInfos.version;
  }

  /**
   * Generator function to create the iterator over all folders and sub folders that contain a 'package.json' file.
   */
  private static async *getModulePathsIn(
    rootPath: string
  ): AsyncGenerator<string> {
    const dirEntries = await fs.readdir(rootPath, { withFileTypes: true });
    for (const entry of dirEntries) {
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        yield* this.getModulePathsIn(path.join(rootPath, entry.name));
      } else if (entry.isFile() && entry.name === 'package.json') {
        yield rootPath;
      }
    }
  }

  /**
   * Returns licenses without undesired properties
   */
  private static getLicenseEntries(
    licenseCheckerJson: ModuleInfos
  ): PackageLicense[] {
    return Object.values(licenseCheckerJson).map((entry) => {
      if (!(entry.name && entry.licenses && entry.licenseText)) {
        throw new Error(
          'Module is missing some entries' + JSON.stringify(entry)
        );
      }
      return new PackageLicense(
        entry.name,
        entry.licenses,
        entry.licenseText,
        entry.repository
      );
    });
  }
}

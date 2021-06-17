import { Fs } from './fs';
import * as path from 'path';
import * as util from 'util';

import * as licenseChecker from 'license-checker';
import csv from 'csv-stringify';

import { SingleBar } from 'cli-progress';
import { Color } from './color';

const getLicenses = util.promisify(licenseChecker.init);
const csvStringify = util.promisify(csv as any);

interface IPackage {
  licenses: string[];
  dependents: string[];
}

interface IPackages {
  [dependency: string]: IPackage;
}

interface ILicenses {
  [path: string]: licenseChecker.ModuleInfos;
}

export class LicenseCollector {
  /**
   * You may add other permissive licenses but this needs
   * to be double checked first!
   */
  private static readonly LICENSE_WHITELIST = [
    '0BSD',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'BSD',
    'CC-BY-3.0',
    'CC0-1.0',
    'ISC',
    'MIT',
    'Unlicense',
    'WTFPL',
  ];

  private static async collectLicensesFromJobs(
    npmJobs: string[],
    repoDir: string
  ): Promise<ILicenses> {
    const result: ILicenses = {};

    const bar = new SingleBar({
      format: `${Color.task(
        'scanning'
      )} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
    });
    bar.start(npmJobs.length, 0);

    const excludePackages = await this.getOwnPackageNamesWithVersion(
      repoDir,
      npmJobs
    );
    for (let i = 0; i < npmJobs.length; i++) {
      const job = npmJobs[i];
      try {
        result[job] = await getLicenses({
          start: path.join(repoDir, job),
          // show ONLY production packages
          production: true,
          // filter own packages
          excludePackages,
          // fail if license is not supported
          onlyAllow: this.LICENSE_WHITELIST.join(';'),
        });
      } catch (err) {
        if (err.message === 'No packages found in this path..') {
          result[job] = {};
        } else if (err.message.includes('--onlyAllow')) {
          throw new Error(err);
        } else {
          console.error(err);
        }
      }
      bar.update(i + 1);
    }
    bar.stop();
    return result;
  }

  private static async getOwnPackageNamesWithVersion(
    repoDir: string,
    npmJobs: string[]
  ): Promise<string> {
    const packages: string[] = [];
    for (const job of npmJobs) {
      const packageJson = await Fs.readJson(
        path.join(repoDir, job, 'package.json')
      );
      packages.push(`${packageJson.name}@${packageJson.version}`);
    }
    return packages.join(';');
  }

  private static parsePackageName(packageName: string) {
    const index = packageName.lastIndexOf('@');
    if (index === -1) {
      throw new Error(`invalid package name ${packageName}`);
    }
    const name = packageName.substr(0, index);
    const version = packageName.substr(index + 1);
    return {
      name,
      version,
    };
  }

  private static createPackageList(licenses: ILicenses): IPackages {
    const result: IPackages = {};
    for (const [parentName, packages] of Object.entries(licenses)) {
      for (const [packageName, packageInfo] of Object.entries(packages)) {
        const { name, version } =
          LicenseCollector.parsePackageName(packageName);

        let dependency = result[name];
        if (!dependency) {
          dependency = {
            licenses: [],
            dependents: [],
          };
          result[name] = dependency;
        }
        if (typeof packageInfo.licenses === 'string') {
          if (dependency.licenses.indexOf(packageInfo.licenses) === -1) {
            dependency.licenses.push(packageInfo.licenses);
          }
        } else if (Array.isArray(packageInfo.licenses)) {
          for (const license of packageInfo.licenses) {
            if (dependency.licenses.indexOf(license) === -1) {
              dependency.licenses.push(license);
            }
          }
        }

        dependency.dependents.push(`${version}@${parentName}`);
      }
    }
    return result;
  }

  private static async createCsv(packageList: IPackages): Promise<string> {
    const list = [];
    for (const [name, info] of Object.entries(packageList)) {
      list.push([name, info.licenses.join(','), info.dependents.join(',')]);
    }
    list.sort((a, b) => {
      // sort first by license and then by package name
      const result = a[1].localeCompare(b[1]);
      if (result === 0) {
        return a[0].localeCompare(b[0]);
      }
      return result;
    });
    return (await csvStringify(list, {
      delimiter: ';',
    })) as string;
  }

  public static async collectLicenses(
    npmJobs: string[],
    repoDir: string
  ): Promise<void> {
    const licenses = await LicenseCollector.collectLicensesFromJobs(
      npmJobs,
      repoDir
    );
    const packageList = LicenseCollector.createPackageList(licenses);
    const csv = await LicenseCollector.createCsv(packageList);
    await Fs.writeFile(process.env.OUT_FILE || 'licenses.csv', csv);
  }
}

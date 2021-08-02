/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as oldFs from 'fs';
import * as util from 'util';
import * as yaml from 'yaml';

export class Fs {
  public static readFile = util.promisify(oldFs.readFile);
  public static writeFile = util.promisify(oldFs.writeFile);
  public static readdir = util.promisify(oldFs.readdir);
  public static exists = util.promisify(oldFs.exists);
  public static chmod = util.promisify(oldFs.chmod);
  public static access = util.promisify(oldFs.access);

  public static async fileExists(path: string): Promise<boolean> {
    try {
      await Fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  public static async writeExecutableFile(
    fileName: string,
    content: string
  ): Promise<void> {
    await Fs.writeFile(fileName, content);
    await Fs.chmod(fileName, '755');
  }

  public static async readJson<T = unknown>(fileName: string): Promise<T> {
    return JSON.parse((await Fs.readFile(fileName)).toString()) as T;
  }

  public static async writeYaml(
    fileName: string,
    content: unknown
  ): Promise<void> {
    await Fs.writeFile(fileName, yaml.stringify(content));
  }

  public static async readYaml<T = unknown>(fileName: string): Promise<T> {
    return yaml.parse((await Fs.readFile(fileName)).toString()) as T;
  }
}

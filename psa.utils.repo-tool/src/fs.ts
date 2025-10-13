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

  public static async readJson<T = unknown>(fileName: string): Promise<T> {
    return JSON.parse((await Fs.readFile(fileName)).toString()) as T;
  }

  public static async writeYaml(
    fileName: string,
    content: unknown,
    header: string
  ): Promise<void> {
    await Fs.writeFile(fileName, header + '\n' + yaml.stringify(content));
  }

  public static async readYaml<T = unknown>(fileName: string): Promise<T> {
    return yaml.parse((await Fs.readFile(fileName)).toString()) as T;
  }
}

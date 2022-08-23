/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as path from 'path';

import { RepoMetaData } from './models/repoMetaData';
import { Fs } from './fs';
import { PackageJson } from './models/packageJson';

export class Scanner {
  public static async scanRepo(repoDir: string): Promise<RepoMetaData> {
    // Needed information about the Repo
    const docker: string[] = [];
    const lint: string[] = [];
    const testUnit: string[] = [];
    const testInt: string[] = [];
    const testE2e: string[] = [];
    const npmInstall: string[] = [];

    // Scan the repo dir for information
    for (const name of await Fs.readdir(repoDir)) {
      const fullName = path.join(repoDir, name);
      // Look for docker builds
      if (await Fs.exists(path.join(fullName, 'Dockerfile'))) {
        docker.push(name);
      }
      // Look for npm packages
      const packageFileName = path.join(fullName, 'package.json');
      if (await Fs.exists(packageFileName)) {
        const pack = await Fs.readJson<PackageJson>(packageFileName);
        npmInstall.push(name);
        if (!pack.scripts) {
          continue;
        }
        if (pack.scripts['lint']) {
          lint.push(name);
        }
        if (pack.scripts['test.unit']) {
          testUnit.push(name);
        }
        if (pack.scripts['test.int']) {
          testInt.push(name);
        }
        for (const key of Object.keys(pack.scripts)) {
          const prefix = 'e2e.ci.';
          if (key.startsWith(prefix)) {
            testE2e.push(key.substr(prefix.length));
          }
        }
      }
    }

    return {
      docker,
      lint,
      testUnit,
      testInt,
      testE2e,
      npmInstall,
    };
  }
}

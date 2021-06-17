import * as path from 'path';

import { IJobs } from './definitions';
import { Fs } from './fs';

export class Scanner {
  private static getNpmInstallJobs(jobs: IJobs) {
    return [...jobs.lint, ...jobs.testUnit, ...jobs.testInt].filter(
      (value, index, array) => {
        return array.indexOf(value) === index;
      }
    );
  }

  public static async scanRepo(repoDir: string): Promise<IJobs> {
    // Jobs we support to create
    const docker: string[] = [];
    const lint: string[] = [];
    const testUnit: string[] = [];
    const testInt: string[] = [];
    const testE2e: string[] = [];

    // Scan the repo dir for jobs to create
    for (const name of await Fs.readdir(repoDir)) {
      const fullName = path.join(repoDir, name);
      // Look for docker builds
      if (await Fs.exists(path.join(fullName, 'Dockerfile'))) {
        docker.push(name);
      }
      // Look for npm packages
      const packageFileName = path.join(fullName, 'package.json');
      if (await Fs.exists(packageFileName)) {
        const pack = await Fs.readJson(packageFileName);
        if (!pack.scripts) {
          continue;
        }
        if (pack.scripts.lint) {
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

    const result: IJobs = {
      docker,
      lint,
      testUnit,
      testInt,
      testE2e,
      npmInstall: [],
    };

    result.npmInstall = this.getNpmInstallJobs(result);
    return result;
  }
}

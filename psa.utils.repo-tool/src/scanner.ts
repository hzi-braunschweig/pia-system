/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as path from 'path';

import { RepoMetaData } from './models/repoMetaData';
import { Fs } from './fs';
import { PackageJson } from './models/packageJson';

interface RepoToolConfigFile {
  docker?: {
    dockerfile?: unknown;
  };
}

export class Scanner {
  public static async scanRepo(repoDir: string): Promise<RepoMetaData> {
    // Needed information about the Repo
    const docker: {
      name: string;
      dockerfile: string;
      npmInstall: boolean;
      deploy: boolean;
    }[] = [];
    const npm: string[] = [];
    const lint: string[] = [];
    const testUnit: string[] = [];
    const testInt: string[] = [];
    const testE2e: string[] = [];
    const openApi: string[] = [];

    const deploymentTargetPrefixes = [
      'k8s',
      'psa.app',
      'psa.database',
      'psa.server',
      'psa.service',
    ];

    // Scan the repo dir for information
    for (const name of await Fs.readdir(repoDir)) {
      const fullName = path.join(repoDir, name);
      let dockerfilePath = path.join(fullName, 'Dockerfile');
      const packageFileName = path.join(fullName, 'package.json');

      // Look for repo-tool config
      if (await Fs.exists(path.join(fullName, '.repo-tool.yaml'))) {
        const config: RepoToolConfigFile = await Fs.readYaml(
          path.join(fullName, '.repo-tool.yaml')
        );
        if (typeof config.docker?.dockerfile === 'string') {
          dockerfilePath = path.join(fullName, config.docker.dockerfile);
          if (!(await Fs.exists(dockerfilePath))) {
            throw new Error(
              `configured dockerfile (${dockerfilePath}) for ${name} not found`
            );
          }
        }
      }

      // Look for docker builds
      if (await Fs.exists(dockerfilePath)) {
        const dockerfile = await Fs.readFile(dockerfilePath, 'utf-8');
        const dockerfileContainsNpmInstallStage =
          dockerfile.includes('npm-install');
        const packageJsonExists = await Fs.exists(packageFileName);

        docker.push({
          name,
          dockerfile: path.relative(repoDir, dockerfilePath),
          npmInstall: dockerfileContainsNpmInstallStage && packageJsonExists,
          deploy: deploymentTargetPrefixes.some((prefix) =>
            name.startsWith(prefix)
          ),
        });
      }
      // Look for npm packages
      if (await Fs.exists(packageFileName)) {
        const pack = await Fs.readJson<PackageJson>(packageFileName);
        npm.push(name);
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
        if (pack.scripts['build.openapi']) {
          openApi.push(name);
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
      npm,
      lint,
      testUnit,
      testInt,
      testE2e,
      openApi,
    };
  }
}

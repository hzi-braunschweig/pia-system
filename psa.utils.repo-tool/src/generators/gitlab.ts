/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Fs } from '../fs';
import { RepoMetaData } from '../models/repoMetaData';
import * as path from 'path';
import { GENERATOR_HEADER_COMMENT } from './common';

interface GitlabCiModules {
  '.modules': {
    list: {
      docker: string;
      lint: string;
      install: string;
      unit: string;
      int: string;
    };
    array: {
      lint: string[];
      unit: string[];
      int: string[];
      e2e: string[];
      openapi: string[];
    };
  };
}

export class GitlabCI {
  public static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    // Read our env variables
    const targetFile =
      process.env['GITLABCI_TARGET_FILE'] ??
      path.join(repoDir, 'ci/generated.yml');

    // Create the final gitlab ci modules
    const gitlabCi = GitlabCI.createGitlabCiModules(repoMetaData);

    // Write the resulting gitlab-ci.yml
    await Fs.writeYaml(targetFile, gitlabCi, `# ${GENERATOR_HEADER_COMMENT}\n`);
  }

  private static createGitlabCiModules(jobs: RepoMetaData): GitlabCiModules {
    return {
      '.modules': {
        list: {
          docker: jobs.docker.map((job) => job.name).join(' '),
          lint: jobs.lint.join(' '),
          install: jobs.docker
            .filter((job) => job.npmInstall)
            .map((job) => job.name)
            .join(' '),
          unit: jobs.testUnit.join(' '),
          int: jobs.testInt.join(' '),
        },
        array: {
          int: jobs.testInt,
          e2e: jobs.testE2e,
          unit: jobs.testUnit,
          lint: jobs.lint,
          openapi: jobs.openApi,
        },
      },
    };
  }
}

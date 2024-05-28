/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RepoMetaData } from './models/repoMetaData';

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

export class Generator {
  public static createGitlabCiModules(jobs: RepoMetaData): GitlabCiModules {
    return {
      '.modules': {
        list: {
          docker: jobs.docker.join(' '),
          lint: jobs.lint.join(' '),
          install: jobs.npmInstall.join(' '),
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

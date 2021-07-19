import * as path from 'path';

import { Fs } from './fs';
import { IJobs, IDockerBuild } from './definitions';
import { IGitlabCiTemplate, IGitlabCiJob } from './gitlabci';

import { IHclTargets, Hcl } from './hcl';

export class Generator {
  public static async createGitlabCiModules(jobs: IJobs) {
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
        },
      },
    };
  }
}

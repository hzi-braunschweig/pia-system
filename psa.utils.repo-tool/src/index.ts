/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Command } from 'commander';
import { Color } from './color';

import { RepoMetaData } from './models/repoMetaData';
import { Runner } from './runner';
import { Scanner } from './scanner';

import { GitlabCI } from './generators/gitlab';
import { Hcl } from './generators/hcl';
import { Skaffold } from './generators/skaffold';

class Program {
  public static handleError<T>(promise: Promise<T>): void {
    promise.catch((err) => {
      console.error(Color.error('unexpected error'));
      console.error(err);
      process.exit(1);
    });
  }

  public static async main(): Promise<void> {
    const repoDir = process.env['REPO_DIR'] ?? '.';

    // Scan the repo for metadata
    const repoMetaData = await Scanner.scanRepo(repoDir);

    // commander is not handling promises correctly therefore we have to
    // catch async exceptions in action() by ourself
    const program = new Command();
    program.version('0.0.0');
    program
      .command('test')
      .description('runs tests on repo')
      .action(() => {
        Program.handleError(Runner.executeTests(repoMetaData, repoDir));
      });
    program
      .command('generate')
      .description(
        'generates ci files, docker build hcl files and skaffold.yaml'
      )
      .action(() => {
        Program.handleError(this.generate(repoMetaData, repoDir));
      });
    program
      .command('update')
      .description('runs npm update on node modules')
      .action(() => {
        Program.handleError(Runner.executeNpmUpdate(repoMetaData, repoDir));
      });
    program
      .command('outdated')
      .description('collects infos about outdated packages that are used')
      .action(() => {
        Program.handleError(Runner.executeNpmOutdate(repoMetaData, repoDir));
      });
    program
      .command('audit')
      .description('run audit on packages that are used')
      .action(() => {
        Program.handleError(Runner.executeNpmAudit(repoMetaData, repoDir));
      });

    program.parse();
  }

  private static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    console.log(repoMetaData);

    await GitlabCI.generate(repoMetaData, repoDir);
    await Hcl.generate(repoMetaData, repoDir);
    await Skaffold.generate(repoMetaData, repoDir);
  }
}

Program.handleError(Program.main());

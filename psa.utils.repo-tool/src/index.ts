/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Command } from 'commander';
import * as path from 'path';

import { RepoMetaData } from './models/repoMetaData';
import { Scanner } from './scanner';

import { Fs } from './fs';
import { Runner } from './runner';
import { Generator } from './generator';
import { Color } from './color';
import { RouteMetaDataScanner } from './route-meta-data-scanner';

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
      .description('generates ci stuff')
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
      .command('scan-routes')
      .description('scans all api routes and collects its meta data')
      .action(() => {
        Program.handleError(RouteMetaDataScanner.scan());
      });

    program.parse();
  }

  private static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    // Read our env variables
    const tagetFile =
      process.env['TARGET_FILE'] ?? path.join(repoDir, 'ci/generated.yml');

    console.log(repoMetaData);

    // Create the final gitlab ci modules
    const gitlabCi = Generator.createGitlabCiModules(repoMetaData);

    // Write the resulting gitlab-ci.yml
    await Fs.writeYaml(tagetFile, gitlabCi);
  }
}

Program.handleError(Program.main());

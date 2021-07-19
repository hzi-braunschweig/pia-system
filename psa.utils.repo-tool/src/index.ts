import { Command } from 'commander';
import * as path from 'path';

import { IJobs } from './definitions';
import { Scanner } from './scanner';

import { Fs } from './fs';
import { Runner } from './runner';
import { Generator } from './generator';
import { LicenseCollector } from './licensecollector';

import { Color } from './color';
import { RouteMetaDataScanner } from './route-meta-data-scanner';

class Program {
  private static async generate(jobs: IJobs, repoDir: string) {
    // Read our env variables
    const tagetFile =
      process.env.TARGET_FILE || path.join(repoDir, 'ci/generated.yml');

    console.log(jobs);

    // Create the final gitlab ci modules
    const gitlabCi = await Generator.createGitlabCiModules(jobs);

    // Write the resulting gitlab-ci.yml
    await Fs.writeYaml(tagetFile, gitlabCi);
  }

  public static handleError<T>(promise: Promise<T>) {
    promise.catch((err) => {
      console.error(Color.error('unexpected error'));
      console.error(err);
      process.exit(1);
    });
  }

  public static async main() {
    const repoDir = process.env.REPO_DIR || '.';

    // Scan the repo for possible jobs
    const jobs = await Scanner.scanRepo(repoDir);

    // commander is not handling promises correctly therefore we have to
    // catch async exceptions in action() by ourself
    const program = new Command();
    program.version('0.0.0');
    program
      .command('test')
      .description('runs tests on repo')
      .action(() => {
        Program.handleError(Runner.executeTests(jobs, repoDir));
      });
    program
      .command('update')
      .description('runs npm update on node modules')
      .action(() => {
        Program.handleError(Runner.executeNpmUpdate(jobs, repoDir));
      });
    program
      .command('license')
      .description('collects license infos')
      .action(() => {
        Program.handleError(
          LicenseCollector.collectLicenses(jobs.npmInstall, repoDir)
        );
      });
    program
      .command('outdated')
      .description('collects infos about outdated packages that are used')
      .action(() => {
        Program.handleError(Runner.executeNpmOutdate(jobs, repoDir));
      });
    program
      .command('scan-routes')
      .description('scans all api routes and collects its meta data')
      .action(() => {
        Program.handleError(RouteMetaDataScanner.scan());
      });

    program.parse();
  }
}

Program.handleError(Program.main());

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Command } from 'commander';
import * as path from 'path';
import { Color } from './color';

import { Fs } from './fs';
import { Generator } from './generator';

import { RepoMetaData } from './models/repoMetaData';
import { Runner } from './runner';
import { Scanner } from './scanner';

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
      .command('generate-hcl')
      .description('generates docker build hcl')
      .action(() => {
        Program.handleError(this.generateHcl(repoMetaData, repoDir));
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

  private static async generateHcl(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    // Read our env variables
    const targetFile =
      process.env['BAKE_TARGET_FILE'] ?? path.join(repoDir, 'bake.hcl');

    const deploymentTargetPrefixes = [
      'k8s',
      'psa.app',
      'psa.database',
      'psa.server',
      'psa.service',
    ];

    const file: string[] = [];

    file.push(
      'group "default" {',
      '  targets = [ ',
      repoMetaData.docker
        .map((job) => `"${this.convertFolderNameToTargetName(job)}"`)
        .join(', '),
      '  ]',
      '}',
      '',
      'group "deployment" {',
      '  targets = [ ',
      repoMetaData.docker
        .filter((job) =>
          deploymentTargetPrefixes.some((prefix) => job.startsWith(prefix))
        )
        .map((job) => `"${this.convertFolderNameToTargetName(job)}"`)
        .join(', '),
      '  ]',
      '}',
      '',
      'variable "TAG" {',
      '  default = "develop"',
      '}',
      '',
      'variable "IMAGE_REGISTRY" {',
      '  default = "pia"',
      '}',
      '',
      'variable "VERSION_INFO_PIPELINE_ID" {',
      '  default = "develop"',
      '}',
      '',
      'variable "VERSION_INFO_GIT_HASH" {',
      '  default = "UNKNOWN"',
      '}',
      '',
      'variable "VERSION_INFO_GIT_REF" {',
      '  default = "UNKNOWN"',
      '}',
      '',
      ...repoMetaData.docker.flatMap((job) => {
        return [
          `target "${this.convertFolderNameToTargetName(job)}" {`,
          '  context = "."',
          `  dockerfile = "${job}/Dockerfile"`,
          '  tags = [ "${IMAGE_REGISTRY}/' + job + ':${TAG}" ]',
          '  args = {',
          `    DIR = "${job}"`,
          '    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"',
          '    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"',
          '    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"',
          '  }',
          '}',
        ];
      })
    );

    await Fs.writeFile(targetFile, file.join('\n'));
  }

  private static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    // Read our env variables
    const targetFile =
      process.env['TARGET_FILE'] ?? path.join(repoDir, 'ci/generated.yml');

    console.log(repoMetaData);

    // Create the final gitlab ci modules
    const gitlabCi = Generator.createGitlabCiModules(repoMetaData);

    // Write the resulting gitlab-ci.yml
    await Fs.writeYaml(targetFile, gitlabCi);
  }

  private static convertFolderNameToTargetName(folderName: string): string {
    return folderName.replace(/\./g, '_');
  }
}

Program.handleError(Program.main());

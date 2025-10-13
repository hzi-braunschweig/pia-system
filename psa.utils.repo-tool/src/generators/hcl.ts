/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as path from 'path';

import { RepoMetaData } from '../models/repoMetaData';
import { GENERATOR_HEADER_COMMENT } from './common';
import { Fs } from '../fs';

export class Hcl {
  public static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    await Hcl.generateHcl(repoMetaData, repoDir);
    await Hcl.generateNpmInstall(repoMetaData, repoDir);
  }

  private static async generateHcl(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    const targetFile =
      process.env['BAKE_TARGET_FILE'] ?? path.join(repoDir, 'bake.hcl');

    const file: string[] = [
      '# ' + GENERATOR_HEADER_COMMENT,
      '',
      'group "default" {',
      '  targets = [ ',
      repoMetaData.docker
        .map((job) => `"${this.convertFolderNameToTargetName(job.name)}"`)
        .join(', '),
      '  ]',
      '}',
      '',
      'group "deployment" {',
      '  targets = [ ',
      repoMetaData.docker
        .filter((job) => job.deploy)
        .map((job) => `"${this.convertFolderNameToTargetName(job.name)}"`)
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
          `target "${this.convertFolderNameToTargetName(job.name)}" {`,
          '  context = "."',
          `  dockerfile = "${job.dockerfile}"`,
          '  tags = [ "${IMAGE_REGISTRY}/' + job.name + ':${TAG}" ]',
          '  args = {',
          `    DIR = "${job.name}"`,
          '    VERSION_INFO_PIPELINE_ID = "${VERSION_INFO_PIPELINE_ID}"',
          '    VERSION_INFO_GIT_HASH = "${VERSION_INFO_GIT_HASH}"',
          '    VERSION_INFO_GIT_REF = "${VERSION_INFO_GIT_REF}"',
          '  }',
          '}',
        ];
      }),
    ];

    await Fs.writeFile(targetFile, file.join('\n'));
  }

  private static async generateNpmInstall(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    const npmInstallTargetFile =
      process.env['NPM_INSTALL_BAKE_TARGET_FILE'] ??
      path.join(repoDir, 'npm-install.hcl');

    const npmInstallJobs = repoMetaData.docker.filter((job) => job.npmInstall);
    const npmInstallFile: string[] = [
      '# ' + GENERATOR_HEADER_COMMENT,
      '',
      'group "default" {',
      '  targets = [ ',

      npmInstallJobs
        .map((job) => `"${Hcl.convertFolderNameToTargetName(job.name)}"`)
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
      ...npmInstallJobs.flatMap((job) => {
        return [
          `target "${Hcl.convertFolderNameToTargetName(job.name)}" {`,
          '  context = "."',
          `  dockerfile = "${job.dockerfile}"`,
          '  target = "npm-install"',
          '  tags = [ "${IMAGE_REGISTRY}/' +
            job.name +
            '-npm-install:${TAG}" ]',
          '  args = {',
          `    DIR = "${job.name}"`,
          '  }',
          '}',
        ];
      }),
    ];

    await Fs.writeFile(npmInstallTargetFile, npmInstallFile.join('\n'));
  }

  private static convertFolderNameToTargetName(folderName: string): string {
    return folderName.replace(/\./g, '_');
  }
}

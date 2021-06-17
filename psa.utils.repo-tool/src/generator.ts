import * as path from 'path';

import { Fs } from './fs';
import { IJobs, IDockerBuild } from './definitions';
import { IGitlabCiTemplate, IGitlabCiJob } from './gitlabci';

import { IHclTargets, Hcl } from './hcl';

export class Generator {
  public static async createDockerBake(docker: string[]) {
    const target: IHclTargets = {};
    const result = { target };

    for (const image of docker) {
      target[image] = {
        context: `./${image}`,
        dockerfile: `Dockerfile`,
        tags: [`registry.netzlink.com/pia/${image}`],
        args: {
          DOMAIN_NAME: '127.0.0.1.xip.io',
          image: image,
        },
      };
    }

    await Fs.writeFile('docker-bake.json', JSON.stringify(result, null, '  '));
    await Fs.writeFile('docker-bake.hcl', new Hcl().stringify(target));
  }

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

  private static async getLocalDepencencies(
    name: string,
    repoDir: string,
    localDependencies: string[]
  ) {
    const fullName = path.join(repoDir, name);
    const packageFileName = path.join(fullName, 'package.json');
    const pack = await Fs.readJson(packageFileName);

    const dependencyRefs: string[] = [];
    for (const [, value] of Object.entries(pack.dependencies || {})) {
      dependencyRefs.push(value as string);
    }
    for (const [, value] of Object.entries(pack.devDependencies || {})) {
      dependencyRefs.push(value as string);
    }

    for (const dependency of dependencyRefs) {
      const prefix = 'file:../';
      if (dependency.indexOf(prefix) === 0) {
        const localDependency = dependency.substring(prefix.length);
        if (localDependencies.indexOf(localDependency) === -1) {
          localDependencies.push(localDependency);
          // get local dependencies of a local dependency
          await Generator.getLocalDepencencies(
            localDependency,
            repoDir,
            localDependencies
          );
        }
      }
    }
  }

  public static insertAtMarker(
    template: string,
    marker: string,
    content: string
  ): string {
    const parts = template.split(`### TEMPLATE-MARKER: ${marker} ####`);

    if (parts.length !== 2) {
      throw new Error('marker not found in template');
    }
    return parts[0] + content + parts[1];
  }

  public static async createNpmInstallDockerfiles(
    jobs: IJobs,
    repoDir: string,
    templateDir: string,
    npmInstallDockerfilesDir: string
  ) {
    const template = (
      await Fs.readFile(path.join(templateDir, 'npm-install.dockerfile'))
    ).toString();

    for (const name of jobs.npmInstall) {
      const localDependencies: string[] = [];
      await Generator.getLocalDepencencies(name, repoDir, localDependencies);
      const copyDependencies = localDependencies
        .map((localDependency) => {
          return `COPY ${localDependency}/ /dependencies/${localDependency}/`;
        })
        .join('\n');

      await Fs.writeFile(
        path.join(npmInstallDockerfilesDir, `npm-install-${name}.dockerfile`),
        Generator.insertAtMarker(
          template,
          'copy-local-dependencies',
          copyDependencies
        )
      );
    }
  }

  public static async createLicenseCollectorDockerfile(
    jobs: IJobs,
    templateDir: string,
    generatedDockerfilesDir: string
  ) {
    const template = (
      await Fs.readFile(path.join(templateDir, 'license-collector.dockerfile'))
    ).toString();

    const includeDependencies: string[] = [];
    const mountDependencies: string[] = [];

    for (const name of jobs.npmInstall) {
      includeDependencies.push(
        `FROM registry.netzlink.com/pia/${name}-npm-install:\${VERSION} as ${name}-npm-install`
      );

      mountDependencies.push(
        `\t--mount=type=bind,ro,from=${name}-npm-install,source=/dependencies/${name},target=/dependencies/${name} \\`
      );
    }

    let result = template;
    result = Generator.insertAtMarker(
      result,
      'include-dependencies',
      includeDependencies.join('\n')
    );
    result = Generator.insertAtMarker(
      result,
      'mount-dependencies',
      mountDependencies.join('\n')
    );

    await Fs.writeFile(
      path.join(generatedDockerfilesDir, `license-collector.dockerfile`),
      result
    );
  }
}

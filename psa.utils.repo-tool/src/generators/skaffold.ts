/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RepoMetaData } from '../models/repoMetaData';
import path from 'path';
import { Fs } from '../fs';
import { GENERATOR_HEADER_COMMENT } from './common';

export class Skaffold {
  public static async generate(
    repoMetaData: RepoMetaData,
    repoDir: string
  ): Promise<void> {
    const targetFile =
      process.env['SKAFFOLD_TARGET_FILE'] ??
      path.join(repoDir, 'skaffold.yaml');

    const artifacts: {
      image: string;
      context: string;
      docker: {
        dockerfile: string;
        buildArgs: Record<string, string>;
      };
    }[] = [];

    const template = {
      apiVersion: 'skaffold/v4beta9',
      kind: 'Config',
      metadata: {
        name: 'pia',
      },
      build: {
        local: {
          useBuildkit: true,
          // a high number of concurrent builds can cause issues and is therefore limited
          concurrency: 3,
        },
        artifacts,
      },
      manifests: {
        kustomize: {
          paths: ['k8s/deployment/base'],
        },
        hooks: {
          before: [
            {
              host: {
                command: [
                  'sh',
                  '-c',
                  'test -f "k8s/deployment/overlays/local-k3d/internal-secrets.yaml" && echo "Internal secrets exist. Continuing..." || npm run --silent generate-internal-secrets --prefix ./k8s > ./k8s/deployment/overlays/local-k3d/internal-secrets.yaml && cp ./k8s/deployment/overlays/local-k3d/internal-secrets.yaml ./k8s/deployment/overlays/local-docker-desktop/internal-secrets.yaml',
                ],
              },
            },
          ],
        },
      },
      profiles: [
        {
          name: 'local-k3d',
          manifests: {
            kustomize: {
              paths: ['k8s/deployment/overlays/local-k3d'],
            },
          },
          activation: [
            {
              command: 'dev',
            },
          ],
        },
        {
          name: 'local-docker-desktop',
          manifests: {
            kustomize: {
              paths: ['k8s/deployment/overlays/local-docker-desktop'],
            },
          },
        },
      ],
      deploy: {
        kubectl: {
          hooks: {
            before: [
              {
                host: {
                  command: [
                    'sh',
                    '-c',
                    'kubectl -n pia apply -f ./k8s/deployment/overlays/local-k3d/persistent-resources.yaml',
                  ],
                  dir: './',
                },
              },
            ],
          },
        },
      },
    };

    template.build.artifacts = repoMetaData.docker
      .filter((job) => job.deploy)
      .map((job) => {
        return {
          image: `registry.hzdr.de/pia-eresearch-system/pia/${job.name}`,
          context: '.',
          docker: {
            dockerfile: job.dockerfile,
            buildArgs: {
              DIR: job.name,
            },
          },
        };
      });

    await Fs.writeYaml(targetFile, template, `# ${GENERATOR_HEADER_COMMENT}\n`);
  }
}

/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const child = require('node:child_process');
const { performance } = require('node:perf_hooks');

const BASE_NAME = 'registry.hzdr.de/pia-eresearch-system/pia';

const TARGET = 'k8s/deployment/components/custom-registry/kustomization.yaml';

async function measureSeconds(promise) {
  const start = performance.now();
  await promise;
  const end = performance.now();
  return Math.round((end - start) / 1000);
}

async function processEnds(childProcess) {
  return await new Promise((resolve, reject) => {
    childProcess.once('close', resolve);
    childProcess.once('error', reject);
  });
}

async function build(imageRegistry, buildMetadataFile) {
  console.log('🛠️ building pia');

  const buildx = child.spawn(
    `docker`,
    [
      'buildx',
      'bake',
      '--file=bake.hcl',
      '--push',
      `--metadata-file=${buildMetadataFile}`,
      'deployment',
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        IMAGE_REGISTRY: imageRegistry,
      },
    }
  );

  const result = await processEnds(buildx);

  if (result !== 0) {
    console.error(`❌ build failed with status code ${result}`);
    process.exit(1);
    return;
  }

  console.log(`✅ build successful`);
}

async function convertMetadata(imageRegistry, buildMetadataFile) {
  const metadata = JSON.parse(
    (await fs.readFile(buildMetadataFile)).toString()
  );

  const lines = Object.values(metadata)
    .map((value) => {
      const lastColon = value['image.name'].lastIndexOf(':');
      const name = value['image.name'].slice(0, lastColon);
      const tag = value['image.name'].slice(lastColon + 1);
      return {
        digest: value['containerimage.digest'],
        newName: name,
        oldName: name.replace(imageRegistry, BASE_NAME),
        tag,
      };
    })
    .flatMap((value) => {
      return [
        `- name: ${value.oldName}`,
        `  newName: ${value.newName}`,
        `  newTag: ${value.tag}@${value.digest}`,
      ];
    });

  await fs.mkdir(path.dirname(TARGET), { recursive: true });
  await fs.writeFile(
    TARGET,
    [
      'apiVersion: kustomize.config.k8s.io/v1alpha1',
      'kind: Component',
      'images:',
      ...lines,
    ].join('\n')
  );
}

async function deploy() {
  console.log('🚀 deploying pia');

  const kubectl = child.spawn(
    `kubectl`,
    ['apply', `--kustomize=k8s/deployment/overlays/local-k3d/`],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
      },
    }
  );

  const result = await processEnds(kubectl);

  if (result !== 0) {
    console.error(`❌ kubectl apply failed with status code ${result}`);
    process.exit(1);
  }

  console.log('✅ deployment successful');
}

async function main() {
  const imageRegistry =
    process.env['IMAGE_REGISTRY'] ?? 'k3d-registry.localhost:5000';
  const buildMetadataFile = '.build.metadata.json';

  const timing = {
    build: await measureSeconds(build(imageRegistry, buildMetadataFile)),
    convert: await measureSeconds(
      convertMetadata(imageRegistry, buildMetadataFile)
    ),
    deploy: await measureSeconds(deploy()),
  };

  console.log(
    `⏱️ elapsed time build=${timing.build}s convert=${timing.convert}s deploy=${timing.deploy}s`
  );
}

main();

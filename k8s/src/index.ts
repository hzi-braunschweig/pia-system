/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { App } from 'cdk8s';
import { InternalSecrets } from './pia/internalSecrets';
import { stringify } from 'yaml';
import { MainChart } from './main';

import { Command } from 'commander';
import { PiaConfig } from './pia/piaConfig';

const program = new Command();

program.command('generate-internal-secrets').action(() => {
  const app = new App();
  const internalSecrets = InternalSecrets.createChart(app);

  const documents = internalSecrets.toJson().map((doc) => stringify(doc));

  console.log(documents.join('---\n'));
});

program.command('generate-k8s-objects').action(() => {
  const app = new App();

  const documents = new MainChart(app).allCharts
    .flatMap((chart) => chart.toJson() as unknown)
    .map((doc) =>
      stringify(doc, {
        lineWidth: 160,
      })
    );

  console.log(documents.join('---\n'));
});

program
  .command('precheck')
  .argument('<internal-secrets-path>')
  .argument('<pia-config-path>')
  .action((internalSecretsPath: string, piaConfigPath: string) => {
    const missingInternalSecrets =
      InternalSecrets.getMissing(internalSecretsPath);
    const missingPiaConfig = PiaConfig.getMissing(piaConfigPath);

    if (missingInternalSecrets.length !== 0) {
      console.error('missing internal secrets:');
      console.error(missingInternalSecrets);
    }

    if (missingPiaConfig.length !== 0) {
      console.error('missing pia config:');
      console.error(missingPiaConfig);
    }

    if (missingInternalSecrets.length === 0 && missingPiaConfig.length === 0) {
      console.log('precheck passed');
    } else {
      console.error('precheck failed');
      process.exitCode = 1;
    }
  });

program.parse();

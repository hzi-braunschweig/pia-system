/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Command } from 'commander';
import { GenerateTestDataCommand } from './commands/generate-test-data.command';

const program = new Command();

program
  .name('psa.test.data')
  .description('CLI tool to create data via API')
  .requiredOption('-u, --admin-user <username>', 'name sysadmin user')
  .requiredOption('-p, --admin-password <password>', 'password sysadmin user')
  .requiredOption('-ku, --keycloak-user <username>', 'name keycloak admin user')
  .requiredOption(
    '-kp, --keycloak-password <password>',
    'password keycloak admin user'
  )
  .requiredOption(
    '-h, --host <string>',
    'host of PIA instance',
    'pia-app.local'
  );

program
  .command('seed')
  .description(
    'Will seed the targeted instance with studies, professional roles and probands. Logins will be saved to a json file.'
  )
  .option(
    '--study-prefix <string>',
    'the string used to prefix the names of generated data',
    'API'
  )
  .option('--studies-count <number>', 'amount of studies to generate', '1')
  .option(
    '--questionnaires-count <number>',
    'amount of questionnaires to generate for each study. Either set a single value for each study or set an' +
      'array of values, that matches --studies-count in length. e.g. "2,2,4,1".',
    '1'
  )
  .option(
    '--probands-count <number>',
    'amount of probands to generate for each study',
    '1'
  )
  .option(
    '--blood-samples-count <number>',
    'amount of blood samples to generate for each proband',
    '0'
  )
  .option(
    '--probands-export-file <string>',
    'file to save proband usernames/passwords to',
    'probands.json'
  )
  .option(
    '--professionals-export-file <string>',
    'file to save professional usernames/passwords to',
    'professionals.json'
  )
  .option(
    '-sa, --submit-answers',
    'should proband questionnaires be answered',
    false
  )
  .option('-ci', 'output logs instead of progress when in CI mode', false)
  .action((options, cmd) => {
    GenerateTestDataCommand.execute(cmd.optsWithGlobals()).catch((error) => {
      program.error(error, { exitCode: 1 });
    });
  });

program.parse();

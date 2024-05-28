/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Command } from 'commander';
import { RemoveOldEventsCommand } from './cli/removeOldEventsCommand';

const program = new Command();
program.name('eventhistory-cli').version('0.0.0');

program
  .command('remove-old-events')
  .description('Removes events older than the configured retention time')
  .action(async () => {
    try {
      await RemoveOldEventsCommand();
    } catch (err: unknown) {
      console.error('Unexpected error:');
      console.error(err);
      process.exit(1);
    }
  });

program.parse();

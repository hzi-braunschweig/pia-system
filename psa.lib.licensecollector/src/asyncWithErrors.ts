/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommandOptions } from './cli';

type commandFn = (root: string, options: CommandOptions) => Promise<void>;

/**
 * Enables passing errors from an async command function to the cli
 */
export const asyncPassErrors: (fn: commandFn) => commandFn = (
  command: commandFn
) => {
  return async (root: string, options: CommandOptions): Promise<void> => {
    try {
      await command(root, options);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  };
};

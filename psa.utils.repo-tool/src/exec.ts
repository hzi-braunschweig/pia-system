/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { spawn } from 'child_process';

export interface ExecResult {
  code: number | null;
  signal: string | null;
  data: string;
  success: boolean;
}

export class Exec {
  public static async run(
    cmd: string,
    args: string[],
    cwd: string
  ): Promise<ExecResult> {
    const child = spawn(cmd, args, {
      cwd,
      env: process.env,
    });

    let data = '';
    child.stdout.on('data', (out) => {
      data += out;
    });

    child.stderr.on('data', (out) => {
      data += out;
    });

    return new Promise((resolve) => {
      child.on('exit', (code, signal) => {
        resolve({
          code,
          signal,
          data,
          success: code === 0,
        });
      });
    });
  }
}

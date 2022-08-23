/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'fs';
import { UserCredentials } from '../models/user.model';
import chalk from 'chalk';

interface ExportedUser extends UserCredentials {
  study: string;
}

export class UserExportService {
  private readonly users = new Set<ExportedUser>();

  constructor(private readonly filename: string) {}

  public addProband(cred: UserCredentials, study: string): void {
    this.users.add({ ...cred, study });
  }

  public writeExport(): void {
    const users = Array.from(this.users).map((cred) => ({
      username: cred.username,
      password: cred.password,
      study: cred.study,
    }));
    const json = JSON.stringify(users);

    fs.writeFileSync(this.filename, json);

    console.log(chalk.green(`Wrote proband logins: ${this.filename}`));
  }
}

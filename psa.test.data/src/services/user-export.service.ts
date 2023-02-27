/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fs from 'fs';
import {
  ProfessionalRole,
  StudyAccess,
  UserCredentials,
} from '../models/user.model';
import chalk from 'chalk';

interface ExportedUser extends UserCredentials {
  study: string;
}

interface ExportedProfessional extends UserCredentials {
  studies: StudyAccess[] | [];
  role: ProfessionalRole;
}

export class UserExportService {
  private readonly users = new Set<ExportedUser>();
  private readonly professionals = new Set<ExportedProfessional>();

  constructor(
    private readonly filename: { probands: string; professionals: string }
  ) {}

  public addProband(cred: UserCredentials, study: string): void {
    this.users.add({ ...cred, study });
  }

  public addProfessional(
    cred: UserCredentials,
    role: ProfessionalRole,
    studies?: StudyAccess[]
  ): void {
    this.professionals.add({ ...cred, role, studies: studies ?? [] });
  }

  public writeExport(): void {
    this.writeProbands();
    this.writeProfessionals();
  }

  private writeProbands() {
    const users = Array.from(this.users).map((cred) => ({
      username: cred.username,
      password: cred.password,
      study: cred.study,
    }));
    this.writeFile(this.filename.probands, users);
  }

  private writeProfessionals() {
    const users = Array.from(this.professionals);
    this.writeFile(this.filename.professionals, users);
  }

  private writeFile(filename: string, jsonData: Record<string, any>) {
    const json = JSON.stringify(jsonData);

    fs.writeFileSync(filename, json);

    console.log(chalk.green(`Wrote ${filename}`));
  }
}

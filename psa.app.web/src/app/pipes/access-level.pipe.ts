/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { AccessLevel } from '../psa.app.core/models/studyAccess';

/**
 * Returns Translation for access level
 */
@Pipe({
  name: 'accessLevelPipe',
  standalone: false,
})
export class AccessLevelPipe implements PipeTransform {
  private readonly accessLevelMapping = {
    read: 'DIALOG.READ',
    write: 'DIALOG.WRITE',
    admin: 'DIALOG.ADMIN',
  };

  constructor() {}

  public transform(accessLevel: AccessLevel): string {
    return this.accessLevelMapping[accessLevel];
  }
}

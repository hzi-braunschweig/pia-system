/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fs from 'fs';

export function getFilesInDirectory(path: string): string[] {
  return fs
    .readdirSync(path, {
      withFileTypes: true,
    })
    .filter((file) => file.isFile() || file.isSymbolicLink())
    .map((file) => file.name);
}

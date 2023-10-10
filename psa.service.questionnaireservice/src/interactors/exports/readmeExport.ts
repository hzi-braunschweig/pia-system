/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import path from 'path';
import { createReadStream } from 'fs';
import { AbstractExportFeature } from './abstractExportFeature';

export class ReadmeExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    this.archive.append(
      createReadStream(path.join('resources', 'README.pdf')),
      {
        name: 'README.pdf',
      }
    );

    return Promise.resolve();
  }
}

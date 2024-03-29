/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Archiver } from 'archiver';
import { ExportFeature } from './exportFeature';
import { ExportOptions } from '../exportInteractor';
import { getExportPoolConnection } from '../../db';

export abstract class AbstractExportFeature implements ExportFeature {
  protected dbPool = getExportPoolConnection();

  public constructor(
    protected readonly startDate: Date,
    protected readonly endDate: Date,
    protected readonly options: ExportOptions,
    protected readonly archive: Archiver,
    protected readonly probandPseudonyms: string[]
  ) {}

  public abstract apply(): Promise<void>;
}

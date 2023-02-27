/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Archiver } from 'archiver';
import { ExportOptions } from '../exportInteractor';

export interface ExportFeature {
  apply(): Promise<void | void[]>;
}

export type ExportFeatureClass = new (
  startDate: Date,
  endDate: Date,
  options: ExportOptions,
  archive: Archiver,
  probandPseudonyms: string[]
) => ExportFeature;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SamplesExport } from './samplesExport';
import { ExportFeatureClass } from './exportFeature';
import { BloodSamplesExport } from './bloodSamplesExport';
import { SettingsExport } from './settingsExport';
import { LabResultsExport } from './labResultsExport';
import { AnswersExport } from './answersExport';
import { CodebookExport } from './codebookExport';

export const availableExportKeys = [
  'answers',
  'samples',
  'bloodsamples',
  'settings',
  'labresults',
  'codebook',
] as const;

export type AvailableExportKeys = typeof availableExportKeys[number];

export const availableExportFeatures = new Map<
  AvailableExportKeys,
  ExportFeatureClass
>([
  ['answers', AnswersExport],
  ['samples', SamplesExport],
  ['settings', SettingsExport],
  ['bloodsamples', BloodSamplesExport],
  ['labresults', LabResultsExport],
  ['codebook', CodebookExport],
]);

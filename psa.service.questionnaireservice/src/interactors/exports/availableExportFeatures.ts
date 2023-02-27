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
import { LegacyAnswersExport } from './legacyAnswersExport';
import { CodebookExport } from './codebookExport';
import { AnswersExport } from './answersExport';
import { ReadmeExport } from './readmeExport';
import { QuestionnaireSettingsExport } from './questionnaireSettingsExport';

export const availableExportKeys = [
  'legacy_answers',
  'answers',
  'questionnaires',
  'samples',
  'bloodsamples',
  'settings',
  'labresults',
  'codebook',
  'readme',
] as const;

export type AvailableExportKeys = typeof availableExportKeys[number];

export const availableExportFeatures = new Map<
  AvailableExportKeys,
  ExportFeatureClass
>([
  ['legacy_answers', LegacyAnswersExport],
  ['answers', AnswersExport],
  ['questionnaires', QuestionnaireSettingsExport],
  ['samples', SamplesExport],
  ['settings', SettingsExport],
  ['bloodsamples', BloodSamplesExport],
  ['labresults', LabResultsExport],
  ['codebook', CodebookExport],
  ['readme', ReadmeExport],
]);

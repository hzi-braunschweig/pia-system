/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Study } from './study';

export type StudyForProbands = Pick<
  Study,
  | 'name'
  | 'sample_prefix'
  | 'sample_suffix_length'
  | 'has_rna_samples'
  | 'has_partial_opposition'
>;

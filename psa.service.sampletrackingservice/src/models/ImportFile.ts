/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabResult } from './LabResult';

export interface ImportFile {
  path: string;
  content: string;
  result?: LabResult;
  success:
    | 'imported_for_existing_sample'
    | 'existing_sample_already_had_labresult'
    | 'imported_for_new_unassigned_sample'
    | 'unassigned_sample_already_had_labresult';
}

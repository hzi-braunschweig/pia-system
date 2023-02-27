/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionMetaInfo } from './questionMetaInfo';
import { ColumnMeta } from './columnMeta';
import { DbCondition } from '../condition';

export interface ExportMetaInfo {
  id: number | null;
  version: number | null;
  name: string | null;
  condition: DbCondition | null;
  questions: Map<number, QuestionMetaInfo>;
  columns: ColumnMeta[];
}

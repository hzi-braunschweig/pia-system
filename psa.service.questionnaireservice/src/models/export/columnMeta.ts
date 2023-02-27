/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ColumnMetaInfo } from './columnMetaInfo';
import { SingleSelectMetaInfo } from './singleSelectMetaInfo';
import { MultiSelectMetaInfo } from './multiSelectMetaInfo';
import { SampleIdMetaInfo } from './sampleIdMetaInfo';

export type ColumnMeta =
  | ColumnMetaInfo
  | SingleSelectMetaInfo
  | MultiSelectMetaInfo
  | SampleIdMetaInfo;

/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SharedColumnMetaInfo } from './sharedColumnMetaInfo';
import { AnswerType } from '../answerOption';

export interface MultiSelectMetaInfo extends SharedColumnMetaInfo {
  answerType: AnswerType.MultiSelect;
  value: string | null;
  code: string | null;
}

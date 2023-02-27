/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SharedColumnMetaInfo } from './sharedColumnMetaInfo';
import { AnswerType } from '../answerOption';

export interface SingleSelectMetaInfo extends SharedColumnMetaInfo {
  answerType: AnswerType.SingleSelect;
  values: string[];
  codes: string[];
}

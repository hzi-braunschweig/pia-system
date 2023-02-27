/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SharedColumnMetaInfo } from './sharedColumnMetaInfo';
import { AnswerType } from '../answerOption';

export interface ColumnMetaInfo extends SharedColumnMetaInfo {
  answerType:
    | AnswerType.PZN
    | AnswerType.Text
    | AnswerType.File
    | AnswerType.Date
    | AnswerType.Timestamp
    | AnswerType.Image
    | AnswerType.None;
}

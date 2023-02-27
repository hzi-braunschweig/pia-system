/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerType } from '../answerOption';
import { DbCondition } from '../condition';

export interface ColumnMetaConditions {
  answerOption: DbCondition | null;
  question: DbCondition | null;
}

export interface SharedColumnMetaInfo {
  name: string;
  conditions: ColumnMetaConditions;
  isMandatory: boolean;
  position: number;
  text: string;
  variableName: string;
  answerOptionId: number;
  answerType: AnswerType;
}

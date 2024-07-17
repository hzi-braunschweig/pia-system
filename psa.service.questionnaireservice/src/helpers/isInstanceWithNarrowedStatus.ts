/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireInstanceStatus } from '../models/questionnaireInstance';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';

export default function isInstanceWithNarrowedStatus<
  S extends QuestionnaireInstanceStatus
>(
  instance: Pick<QuestionnaireInstance, 'status'>,
  allowedStatus: S[]
): instance is Exclude<QuestionnaireInstance, 'status'> & { status: S } {
  return allowedStatus.includes(instance.status as unknown as S);
}

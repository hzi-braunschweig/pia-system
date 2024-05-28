/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerValue } from '../../models/answer';

export default function pznValidator(value: AnswerValue): string | null {
  if (typeof value !== 'string') {
    return 'expected: string';
  } else if (!/^-\d{8}$/.test(value)) {
    return 'expected: PZN';
  }

  return null;
}

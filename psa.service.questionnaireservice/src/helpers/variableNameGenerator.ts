/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RandomDigitsGenerator } from '@pia/lib-service-core';
import { CouldNotCreateNewRandomVariableNameError } from '../errors';

const MAX_TRIES = 100;

export default function variableNameGenerator(
  length: number,
  unavailableNames: string[] = []
): string {
  let variableName = '';

  for (let countTries = 0; countTries < MAX_TRIES; countTries++) {
    variableName = `auto-${RandomDigitsGenerator.generate(length)}`;

    if (!unavailableNames.includes(variableName)) {
      return variableName;
    }
  }

  throw new CouldNotCreateNewRandomVariableNameError(
    `it seems that all possible variable names have been assigned (tried it ${MAX_TRIES} times)`
  );
}

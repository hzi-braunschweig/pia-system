/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PseudonymGenerator } from '../services/pseudonymGenerator';
import { getRepository } from 'typeorm';
import { Proband } from '../entities/proband';
import { PlannedProband } from '../entities/plannedProband';
import { CouldNotCreateNewRandomPseudonymError } from '../errors';

const MAX_TRIES = 100;

export async function generateRandomPseudonym(
  prefix: string,
  digits: number,
  separator = '-'
): Promise<string> {
  let pseudonym = '';

  for (let countTries = 0; countTries < MAX_TRIES; countTries++) {
    pseudonym = PseudonymGenerator.generateRandomPseudonym(
      prefix,
      digits,
      separator
    );

    if (await doesPseudonymNotExist(pseudonym)) {
      return pseudonym;
    }
  }

  throw new CouldNotCreateNewRandomPseudonymError(
    `it seems that all possible pseudonyms have been assigned (tried it ${MAX_TRIES} times)`
  );
}

async function doesPseudonymNotExist(pseudonym: string): Promise<boolean> {
  const existingProband = await getRepository(Proband).findOne({ pseudonym });
  const existingPlannedProband = await getRepository(PlannedProband).findOne({
    pseudonym,
  });

  return existingProband === undefined && existingPlannedProband === undefined;
}

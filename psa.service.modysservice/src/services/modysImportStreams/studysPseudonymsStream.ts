/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Readable } from 'stream';
import { userserviceClient } from '../../clients/userserviceClient';
import { ProbandExternalId } from '../../models/probandExternalId';

export function getStudysPseudonymsReadable(study: string): Readable {
  return Readable.from(getPseudonyms(study));
}

async function* getPseudonyms(
  study: string
): AsyncGenerator<ProbandExternalId, void, undefined> {
  console.log('MODYS Import: fetching pseudonyms from userservice...');
  const pseudonyms: ProbandExternalId[] = await userserviceClient
    .getExternalIds({ study, complianceContact: true })
    .catch((e) => {
      console.log(`MODYS Import: had problems to connect to userservice`, e);
      return [];
    });
  console.log(
    `MODYS Import: got ${pseudonyms.length} pseudonyms from userservice.`
  );
  yield* pseudonyms;
}

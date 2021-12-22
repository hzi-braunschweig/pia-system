/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Readable } from 'stream';
import { userserviceClient } from '../../clients/userserviceClient';

export function getStudysPseudonymsReadable(study: string): Readable {
  return Readable.from(getPseudonyms(study));
}

async function* getPseudonyms(
  study: string
): AsyncGenerator<string, void, undefined> {
  console.log('MODYS Import: fetching pseudonyms from userservice...');
  const pseudonyms: string[] = await userserviceClient
    .getPseudonyms({ study, complianceContact: true })
    .catch((e) => {
      console.log(`MODYS Import: had problems to connect to userservice`, e);
      return [];
    });
  console.log(
    `MODYS Import: got ${pseudonyms.length} pseudonyms from userservice.`
  );
  yield* pseudonyms;
}

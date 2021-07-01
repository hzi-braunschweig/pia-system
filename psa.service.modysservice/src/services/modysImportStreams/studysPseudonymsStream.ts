import { Readable } from 'stream';
import { UserserviceClient } from '../../clients/userserviceClient';

export function getStudysPseudonymsReadable(study: string): Readable {
  return Readable.from(getPseudonyms(study));
}

async function* getPseudonyms(
  study: string
): AsyncGenerator<string, void, undefined> {
  console.log('MODYS Import: fetching pseudonyms from userservice...');
  const pseudonyms: string[] = await UserserviceClient.getPseudonyms(study, [
    'active',
    'deactivation_pending',
  ]).catch((e) => {
    console.log(`MODYS Import: had problems to connect to userservice`, e);
    return [];
  });
  console.log(
    `MODYS Import: got ${pseudonyms.length} pseudonyms from userservice.`
  );
  yield* pseudonyms;
}

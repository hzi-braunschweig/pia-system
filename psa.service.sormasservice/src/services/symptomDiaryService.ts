/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { userserviceClient } from '../clients/userserviceClient';
import { PseudonymGenerator } from './pseudonymGenerator';
import { SormasClient } from '../clients/sormasClient';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { getRepository } from 'typeorm';
import { FollowUp } from '../entities/followUp';
import { config } from '../config';
import {
  FetchProbandError,
  ProbandNotFoundError,
  SormasFetchPersonError,
  UpdateFollowUpError,
  UpdatePersonalDataError,
} from '../errors';
import { JournalPersonDto } from '../models/sormas';

export class SymptomDiaryService {
  private static readonly MAX_TRIES_TO_GENERATE_NEW_PSEUDONYM = 1000;

  public static async generateNewPseudonym(studyName: string): Promise<string> {
    let generatedPseudonym: string;
    // get study with config
    const study = await userserviceClient.getStudy(studyName);
    if (!study) throw new Error('Study not found.');
    if (!study.pseudonym_prefix || !study.pseudonym_suffix_length)
      throw new Error('Study has no pseudonym settings.');
    for (
      let i = 1;
      i <= SymptomDiaryService.MAX_TRIES_TO_GENERATE_NEW_PSEUDONYM;
      i++
    ) {
      generatedPseudonym = PseudonymGenerator.generateRandomPseudonym(
        study.pseudonym_prefix,
        study.pseudonym_suffix_length
      );
      const pseudonymIsNotYetAssigned = !(await userserviceClient.getProband(
        generatedPseudonym
      ));
      if (pseudonymIsNotYetAssigned) return generatedPseudonym;
      // else try again
    }

    throw new Error(
      'It seems to be impossible to generate a unused Pseudonym. I tried a thousand times.'
    );
  }

  /**
   * Updates the followUp and email in PIA after fetching it from SORMAS
   * @param identifications the persons UUID and/or its pseudonym
   * @throws SormasFetchPersonError
   * @throws FetchProbandError
   * @throws ProbandNotFoundError
   * @throws UpdatePersonalDataError
   * @throws UpdateFollowUpError
   */
  public static async updateProbandDataFromSormas(
    identifications:
      | {
          pseudonym?: string;
          personUuid: string;
        }
      | {
          pseudonym: string;
          personUuid?: string;
        }
  ): Promise<JournalPersonDto> {
    let pseudonym: string;
    let personUuid: string;

    if (identifications.pseudonym && identifications.personUuid) {
      pseudonym = identifications.pseudonym;
      personUuid = identifications.personUuid;
    } else if (identifications.personUuid) {
      personUuid = identifications.personUuid;
      const proband = await userserviceClient
        .getProbandByIDS(personUuid)
        .catch((e) => {
          throw new FetchProbandError(
            'A problem occurred while looking up the pseudonym',
            e
          );
        });
      if (!proband)
        throw new ProbandNotFoundError(
          'Could not find the proband by the UUID: ' + personUuid
        );
      pseudonym = proband.pseudonym;
    } else if (identifications.pseudonym) {
      pseudonym = identifications.pseudonym;
      const ids = await userserviceClient.lookupIds(pseudonym).catch((e) => {
        throw new FetchProbandError(
          'A problem occurred while looking up the ids',
          e
        );
      });
      if (!ids)
        throw new ProbandNotFoundError(
          'Could not find a uuid/ids for this pseudonym:' + pseudonym
        );
      personUuid = ids;
    } else {
      throw Error('You must supply at least one of pseudonym or personUuid');
    }

    // Get person data from SORMAS
    const person = await SormasClient.getPerson(personUuid).catch((e) => {
      throw new SormasFetchPersonError(
        `Could not fetch person with UUID ${personUuid} from Sormas`,
        e
      );
    });

    if (!person) {
      throw new SormasFetchPersonError(
        `Could not fetch person with UUID ${personUuid} from Sormas. The response was empty.`
      );
    }

    if (!person.emailAddress) {
      throw new UpdatePersonalDataError('Given email address may not be empty');
    }

    // Store mail in personalData
    await personaldataserviceClient
      .updatePersonalData(pseudonym, {
        email: person.emailAddress,
      })
      .catch((e) => {
        throw new UpdatePersonalDataError('Could not update personal data', e);
      });

    // Store follow up end date
    try {
      const result = await getRepository(FollowUp).update(
        {
          pseudonym: pseudonym,
          study: config.sormas.study,
        },
        {
          endDate: person.latestFollowUpEndDate,
        }
      );
      if (result.affected !== 1) {
        await getRepository(FollowUp).save({
          pseudonym: pseudonym,
          study: config.sormas.study,
          endDate: person.latestFollowUpEndDate,
        });
      }
    } catch (e) {
      throw new UpdateFollowUpError('Could not update follow up', e as Error);
    }

    return person;
  }

  public static async stopFollowUpOfProband(pseudonym: string): Promise<void> {
    const result = await getRepository(FollowUp).update(
      { pseudonym },
      { endDate: null }
    );
    if (result.affected !== 1) {
      throw new Error('Could not update follow up for pseudonym: ' + pseudonym);
    }
  }
}

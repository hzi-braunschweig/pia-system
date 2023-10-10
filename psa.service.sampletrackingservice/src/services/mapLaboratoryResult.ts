/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LabObservation } from '../models/LabObservation';
import { LabResult } from '../models/LabResult';
import { HashService } from './hashService';

import format from 'date-fns/format';

const dateFormat = 'dd.MM.yyyy, H:mm';

// i18n
const statusTranslations: Record<string, string> = {
  analyzed: 'Analysiert',
  new: 'Neu',
  sampled: 'Unterwegs zum Labor',
};

/**
 * Returns an ISO Date as readable date string
 *
 * @example
 * 2018-05-03T00:00:00.000Z => 03.05.2018, 2:00
 */
function formatDate(
  isoDate: string | number | Date | null | undefined
): string | null {
  if (!isoDate) {
    return null;
  }
  return format(new Date(isoDate), dateFormat);
}

/**
 * Converts the list of observations into an object who's keys
 * are the hashed names and the values are the translation of the
 * result.
 */
function convertObservationsToKeyValueObject(
  observations: LabObservation[]
): unknown {
  return Object.fromEntries(
    observations.map((observation) => mapObservationToKeyValue(observation))
  );
}

function mapObservationToKeyValue(
  observation: LabObservation
): [string, unknown] {
  return [
    HashService.createMd5Hash(observation.name!), // Enables the name to be a string of any character
    {
      name: observation.name,
      result: observation.result_string,
      date_of_analysis: formatDate(observation.date_of_analysis),
      date_of_delivery: formatDate(observation.date_of_delivery),
      date_of_announcement: formatDate(observation.date_of_announcement),
    },
  ];
}

/**
 * Maps a lab result to a template specific representation
 */
export function mapLaboratoryResult(labResult: LabResult): unknown {
  return {
    ...labResult,
    date_of_sampling: formatDate(labResult.date_of_sampling),
    status: statusTranslations[labResult.status!],
    lab_observations: convertObservationsToKeyValueObject(
      labResult.lab_observations ?? []
    ),
  };
}

/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { runTransaction } from '../db';
import labResultRepository from '../repositories/labResultRepository';
import labObservationRepository from '../repositories/labObservationRepository';
import { LabResult } from '../models/LabResult';

type ImportSuccess =
  | undefined
  | 'imported_for_existing_sample'
  | 'existing_sample_already_had_labresult'
  | 'imported_for_new_unassigned_sample'
  | 'unassigned_sample_already_had_labresult';

// will be used by the new import api
// has to be refactored to use type-orm!
export class StoreLabResultsService {
  private static readonly TAG = 'LAB RESULT IMPORT - LABRESULT STORER:';

  public async store(labResult: LabResult): Promise<ImportSuccess> {
    if (!labResult.id) {
      console.log(
        StoreLabResultsService.TAG,
        'The lab result has no sample ID'
      );
      return undefined;
    }
    labResult.id = labResult.id.toUpperCase();
    for (const obs of labResult.lab_observations ?? []) {
      obs.lab_result_id = labResult.id;
    }
    return await runTransaction<ImportSuccess>(
      async (transaction): Promise<ImportSuccess> => {
        const oldResult = (await labResultRepository.getLabResult(
          labResult.id,
          {
            transaction,
          }
        )) as LabResult | null;

        if (oldResult) {
          if (oldResult.status === 'analyzed') {
            console.log(
              StoreLabResultsService.TAG,
              'Sample',
              labResult.id,
              'is already analyzed. Skip import'
            );
            if (oldResult.user_id) {
              return 'existing_sample_already_had_labresult';
            } else {
              return 'unassigned_sample_already_had_labresult';
            }
          }
          const labResultUpdate = {
            id: labResult.id,
            order_id: labResult.order_id,
            status: 'analyzed',
            performing_doctor: labResult.performing_doctor,
          };
          await labResultRepository.updateLabResult(labResultUpdate, {
            transaction,
          });
          await labObservationRepository.createLabObservations(
            labResult.lab_observations,
            {
              transaction,
            }
          );
          console.log(
            StoreLabResultsService.TAG,
            'Stored lab result for sample with ID:',
            labResult.id
          );
          return 'imported_for_existing_sample';
        } else {
          // New lab result that was not assigned to a proband before, should be imported as well
          const newLabResult = {
            id: labResult.id,
            user_id: null,
            order_id: labResult.order_id,
            status: 'analyzed',
            new_samples_sent: false,
            performing_doctor: labResult.performing_doctor,
          };
          await labResultRepository.createLabResults(newLabResult, {
            transaction,
          });
          await labObservationRepository.createLabObservations(
            labResult.lab_observations,
            {
              transaction,
            }
          );
          console.log(
            StoreLabResultsService.TAG,
            'Stored lab result for NON EXISTING sample with ID:',
            labResult.id
          );
          return 'imported_for_new_unassigned_sample';
        }
      }
    ).catch((e) => {
      console.log(
        StoreLabResultsService.TAG,
        'Error while storing lab result with id:',
        labResult.id,
        e
      );

      return undefined;
    });
  }
}

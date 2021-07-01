import { ImportFile } from '../../models/ImportFile';
import { Transform, TransformCallback } from 'stream';
import { runTransaction } from '../../db';
import labResultRepository from '../../repositories/labResultRepository';
import labObservationRepository from '../../repositories/labObservationRepository';
import { LabResult } from '../../models/LabResult';

export class StoreLabResultsStream extends Transform {
  private static readonly TAG = 'LAB RESULT IMPORT - LABRESULT STORER:';

  public constructor() {
    super({ objectMode: true });
  }

  public async _transform(
    file: ImportFile,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): Promise<void> {
    const labResult = file.result;
    if (!labResult?.id) {
      console.log(
        StoreLabResultsStream.TAG,
        'The lab result has no sample ID in file:',
        file.path
      );
      return callback();
    }
    labResult.id = labResult.id.toUpperCase();
    labResult.lab_observations?.forEach((obs) => {
      obs.lab_result_id = labResult.id;
    });
    await runTransaction<void>(async (transaction): Promise<void> => {
      const oldResult = (await labResultRepository.getLabResult(labResult.id, {
        transaction,
      })) as LabResult | null;

      if (oldResult) {
        if (oldResult.status === 'analyzed') {
          console.log(
            StoreLabResultsStream.TAG,
            'Sample',
            labResult.id,
            'is already analyzed. Skip import of file:',
            file.path
          );
          if (oldResult.user_id) {
            this.push({
              ...file,
              success: 'existing_sample_already_had_labresult',
            });
          } else {
            this.push({
              ...file,
              success: 'unassigned_sample_already_had_labresult',
            });
          }
          return;
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
          StoreLabResultsStream.TAG,
          'Stored lab result for sample with ID:',
          labResult.id,
          'from file:',
          file.path
        );
        this.push({ ...file, success: 'imported_for_existing_sample' });
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
          StoreLabResultsStream.TAG,
          'Stored lab result for NON EXISTING sample with ID:',
          labResult.id,
          'from file:',
          file.path
        );
        this.push({ ...file, success: 'imported_for_new_unassigned_sample' });
      }
    }).catch((e) => {
      console.log(
        StoreLabResultsStream.TAG,
        'Error while storing lab result with id:',
        labResult.id,
        'from file:',
        file.path,
        e
      );
    });
    callback();
  }
}

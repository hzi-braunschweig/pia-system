const { Transform } = require('stream');
const { runTransaction } = require('../../db');
const labResultRepository = require('../../repositories/labResultRepository');
const labObservationRepository = require('../../repositories/labObservationRepository');

const TAG = 'LAB RESULT IMPORT - LABRESULT STORER:';

class StoreLabResultsStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  /**
   *
   * @param {ImportFile} file
   * @param encoding
   * @param callback
   * @return {Promise<void>}
   * @private
   */
  async _transform(file, encoding, callback) {
    const labResult = file.result;
    if (!labResult.id) {
      console.log(
        TAG,
        'The lab result of has no sample ID in file:',
        file.path
      );
      return callback();
    }
    labResult.id = labResult.id.toUpperCase();
    labResult.lab_observations.forEach((obs) => {
      obs.lab_result_id = labResult.id;
    });
    await runTransaction(async (transaction) => {
      const oldResult = await labResultRepository.getLabResult(labResult.id, {
        transaction,
      });

      if (oldResult) {
        if (oldResult.status === 'analyzed') {
          console.log(
            TAG,
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
          TAG,
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
          TAG,
          'Stored lab result for NON EXISTING sample with ID:',
          labResult.id,
          'from file:',
          file.path
        );
        this.push({ ...file, success: 'imported_for_new_unassigned_sample' });
      }
    }).catch((e) => {
      console.log(
        TAG,
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

module.exports = StoreLabResultsStream;

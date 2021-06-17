const { getDbTransactionFromOptionsOrDbConnection } = require('../db');
const pgp = require('pg-promise')();
/**
 * The ColumnSet of lab_observations.
 * skip causes to ignore the column if no value is submitted to a update statement
 * init inserts a default value for a insert statement, if no value was given for this column
 * @type {pgPromise.ColumnSet<unknown>}
 */
const csLabObservations = new pgp.helpers.ColumnSet(
  [
    {
      name: 'lab_result_id',
      skip: (col) => !col.exists,
    },
    {
      name: 'name_id',
      skip: (col) => !col.exists,
    },
    {
      name: 'name',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'result_value',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'comment',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'date_of_analysis',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'date_of_delivery',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'date_of_announcement',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'lab_name',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'material',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'result_string',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'unit',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'other_unit',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
    {
      name: 'kit_name',
      skip: (col) => !col.exists,
      init: (col) => (col.exists ? col.value : null),
    },
  ],
  { table: 'lab_observations' }
);

class LabObservationRepository {
  /**
   *
   * @param {LabObservation | LabObservation[]} labObservations
   * @param {RepositoryOptions} options
   * @return {Promise<LabObservation[]>}
   */
  static async createLabObservations(labObservations, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.manyOrNone(
      pgp.helpers.insert(labObservations, csLabObservations) +
        ' ON CONFLICT ON CONSTRAINT unique_lab_observation DO NOTHING RETURNING *'
    );
  }
}

module.exports = LabObservationRepository;

const { getDbTransactionFromOptionsOrDbConnection } = require('../db');
const pgp = require('pg-promise')();

/**
 * The ColumnSet of lab_observations.
 * skip causes to ignore the column if no value is submitted to a update statement
 * init inserts a default value for a insert statement, if no value was given for this column
 * @type {pgPromise.ColumnSet<unknown>}
 */
const csLabResults = new pgp.helpers.ColumnSet(
  [
    { name: 'id', cnd: true },
    {
      name: 'user_id',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'order_id',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'number' ? col.value : null),
    },
    {
      name: 'date_of_sampling',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'status',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'remark',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'new_samples_sent',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'boolean' ? col.value : null),
    },
    {
      name: 'performing_doctor',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'dummy_sample_id',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : null),
    },
    {
      name: 'study_status',
      skip: (col) => !col.exists,
      init: (col) => (typeof col.value === 'string' ? col.value : 'active'),
    },
  ],
  { table: 'lab_results' }
);

class LabResultRepository {
  /**
   * Creates a new lab result
   * @param {LabResult | LabResult[]} labResults
   * @param {RepositoryOptions} options
   * @return {Promise<LabResult[]>}
   */
  static async createLabResults(labResults, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.manyOrNone(
      pgp.helpers.insert(labResults, csLabResults) + ' RETURNING *'
    );
  }

  /**
   * Gets a lab result by its ID
   * @param {string} id
   * @param {RepositoryOptions} options
   * @return {Promise<LabResult>}
   */
  static async getLabResult(id, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.oneOrNone('SELECT * FROM lab_results WHERE id = $1', [id]);
  }

  /**
   * Updates a lab result identified by its id
   * @param {LabResult} labResultUpdate
   * @param {RepositoryOptions} options
   * @return {Promise<LabResult>}
   */
  static async updateLabResult(labResultUpdate, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    const update = pgp.helpers.update(labResultUpdate, csLabResults);
    const condition = pgp.as.format(' WHERE id = $(id)', labResultUpdate);
    return db.one(update + condition + ' RETURNING *');
  }
}

module.exports = LabResultRepository;

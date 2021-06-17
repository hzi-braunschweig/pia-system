const { getDbTransactionFromOptionsOrDbConnection } = require('../db');

class PendingDeletionRepository {
  static async getPendingDeletion(probandId, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      'SELECT * FROM pending_deletions WHERE proband_id=$(probandId)',
      { probandId }
    );
  }

  /**
   *
   * @param {PendingDeletionDb} deletion
   * @param {RepositoryOptions} options
   * @return {Promise<PendingDeletionRes>}
   */
  static async createPendingDeletion(deletion, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one(
      `INSERT INTO pending_deletions(requested_by, requested_for, proband_id, study)
             VALUES ($(requested_by), $(requested_for), $(proband_id), $(study))
             RETURNING *`,
      deletion
    );
  }

  static async deletePendingDeletion(probandId, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    await db.none(
      'DELETE FROM pending_deletions WHERE proband_id=$(probandId)',
      { probandId }
    );
  }
}

module.exports = PendingDeletionRepository;

const { getDbTransactionFromOptionsOrDbConnection } = require('../db');

class PendingPartialDeletionRepository {
  /**
   * creates a pending partial deletion
   * @param {PendingPartialDeletionDb} data the pending partial deletions data
   * @param {IOptions=} options
   * @return {Promise<PendingPartialDeletionDb>} the new created pending partial deletion
   */
  static async createPendingPartialDeletion(data, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      `INSERT INTO pending_partial_deletions(requested_by, requested_for, proband_id, from_date, to_date,
                                                   delete_logs, for_instance_ids,
                                                   for_lab_results_ids)
             VALUES ($(requested_by), $(requested_for), $(proband_id), $(from_date), $(to_date), $(delete_logs),
                     $(for_instance_ids),
                     $(for_lab_results_ids))
             RETURNING *`,
      data
    );
  }

  /**
   * executes the pending partial deletion, performs all delete actions associated with it and deletes the db entry
   * @param {number} id the id of the pending partial deletion to update
   * @param {IOptions=} options
   * @return {Promise<PendingPartialDeletionDb>} the executed pending partial deletion
   */
  static async executePendingPartialDeletion(id, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    /** @type {PendingPartialDeletionDb} */
    const pendingPartialDeletion = await db.one(
      'SELECT * FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );

    if (
      pendingPartialDeletion.for_lab_results_ids &&
      pendingPartialDeletion.for_lab_results_ids.length > 0
    ) {
      await db.none(
        'DELETE FROM lab_results WHERE id IN ($(for_lab_results_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        "DELETE FROM notification_schedules WHERE reference_id IN ($(for_lab_results_ids:csv)) AND notification_type='sample'",
        pendingPartialDeletion
      );
    }

    if (
      pendingPartialDeletion.for_instance_ids &&
      pendingPartialDeletion.for_instance_ids.length > 0
    ) {
      await db.none(
        'DELETE FROM user_files WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        'DELETE FROM answers WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        'DELETE FROM questionnaire_instances_queued WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        "DELETE FROM notification_schedules WHERE reference_id::int IN ($(for_instance_ids:csv)) AND notification_type='qReminder'",
        pendingPartialDeletion
      );
      await db.none(
        `UPDATE questionnaire_instances
                 SET date_of_release_v1=NULL,
                     date_of_release_v2=NULL,
                     cycle=0,
                     status='deleted',
                     notifications_scheduled= TRUE
                 WHERE id IN ($(for_instance_ids:csv))`,
        pendingPartialDeletion
      );
    }
    return await db.one(
      'DELETE FROM pending_partial_deletions WHERE id=$(id) RETURNING *',
      { id }
    );
  }

  /**
   * deletes the pending partial deletion and cancels all delete actions associated with it
   * @param {number} id the id of the pending partial deletion to delete
   * @param {IOptions=} options
   * @returns {Promise} a promise that resolves when deletion was successful
   */
  static async deletePendingPartialDeletion(id, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.none(
      'DELETE FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );
  }

  /**
   * gets the pending partial deletion
   * @param {number} id the id of the pending partial deletion to get
   * @param {IOptions=} options
   * @return {Promise<PendingPartialDeletionDb>} the pending partial deletion
   */
  static async getPendingPartialDeletion(id, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      'SELECT * FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );
  }
}

module.exports = PendingPartialDeletionRepository;

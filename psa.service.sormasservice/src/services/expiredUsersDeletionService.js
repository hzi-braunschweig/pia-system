const userserviceClient = require('../clients/userserviceClient');

const expiredUsersDeletionService = (function () {
  /**
   * We do not want to delete users which have active or upcoming questionnaire instances OR
   * released questionnaire answers which are not transferred to SORMAS yet.
   */
  const usersNotToDeleteQuery =
    "SELECT user_id FROM questionnaire_instances WHERE (transmission_ts_v1 IS NULL AND date_of_release_v1 IS NOT NULL) OR (transmission_ts_v2 IS NULL AND date_of_release_v2 IS NOT NULL) OR status IN ('released_once', 'inactive', 'active', 'in_progress') GROUP BY user_id";

  async function checkAndDeleteExpiredUsers(db) {
    /**
     * All questionnaire instances which do not apply to the above exclusions
     * @type {{ user_id: string }[]}
     */
    const usersToDelete = await db.manyOrNone(
      `SELECT user_id
             FROM questionnaire_instances
             WHERE user_id NOT IN (${usersNotToDeleteQuery})
             GROUP BY user_id`
    );

    console.log(
      `checkAndDeleteExpiredUsers: triggering deletion of data of ${usersToDelete.length} users due to reaching the end date`
    );
    usersToDelete.forEach((user) =>
      userserviceClient.deleteUserdata(user.user_id, true).catch(console.error)
    );
  }

  async function checkAndDeleteSingleUser(user_id, db) {
    /**
     * The questionnaire instance of the user if it does not apply to the above exclusions
     * @type {{ user_id: string } | null}
     */
    const shouldDeleteUser = await db.oneOrNone(
      `SELECT user_id
             FROM questionnaire_instances
             WHERE user_id NOT IN (${usersNotToDeleteQuery})
               AND user_id = $(user_id)
             GROUP BY user_id`,
      { user_id }
    );

    if (shouldDeleteUser !== null) {
      console.log(
        `checkAndDeleteExpiredUsers: triggering deletion of a single user's data due to reaching the end date`
      );
      userserviceClient.deleteUserdata(user_id, true);
    }
  }

  return {
    /**
     * Triggers the deletion of users and its data if they reached the SORMAS end date
     *
     * @param db the connected postgresql db object
     * @returns {Promise<void>}
     */
    checkAndDeleteExpiredUsers: checkAndDeleteExpiredUsers,

    /**
     * Triggers the deletion of a single user's data if it reached the SORMAS end date
     *
     * @param user_id {string} the id of the user to check
     * @param db the connected postgresql db object
     * @returns {Promise<void>}
     */
    checkAndDeleteSingleUser: checkAndDeleteSingleUser,
  };
})();

module.exports = expiredUsersDeletionService;

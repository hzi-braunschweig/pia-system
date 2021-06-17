const addDays = require('date-fns/addDays');

const { getDbTransactionFromOptionsOrDbConnection } = require('../db');

class UserLogRepository {
  /**
   * saves a log entry
   * @param {string} user_id the users id
   * @param {UserLogReq} log the log data to be saved
   * @param {RepositoryOptions} options
   * @return {Promise<UserLogDb>}
   */
  static async postLog(user_id, log, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      'INSERT INTO user_logs(user_id, activity_timestamp, activity, app) VALUES ($1, $2, $3, $4) RETURNING id, user_id, activity_timestamp AS timestamp, activity, app',
      [user_id, log.timestamp, log.activity, log.app]
    );
  }

  /**
   * gets logs by filter
   * @param {string[]} probands the probands to get logs for
   * @param {UserLogFilter} filter the filter params
   * @param {RepositoryOptions} options
   * @return {Promise<UserLogDb[]>}
   */
  static async getLogsFor(probands, filter, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    let q_activities = [];
    let other_types = [];
    const sqlSelectStatement =
      'SELECT id, user_id, app, activity_timestamp::timestamptz AS timestamp, activity FROM user_logs WHERE user_id IN ($1:csv) AND activity_timestamp >= $2 AND activity_timestamp < $3';

    try {
      let fromTime = new Date(0);
      let toTime = addDays(new Date(), 1);

      let activities = [
        'login',
        'logout',
        'q_released_twice',
        'q_released_once',
      ];

      if (filter.fromTime) {
        fromTime = filter.fromTime;
      }

      if (filter.toTime) {
        toTime = addDays(filter.toTime, 1);
      }

      if (filter.activities) {
        activities = filter.activities;

        q_activities = activities.filter((e) => {
          return e === 'q_released_twice' || e === 'q_released_once';
        });

        if (q_activities.length <= 0) {
          q_activities = ['q_released_twice', 'q_released_once'];
        }

        other_types = activities.filter((e) => {
          return e === 'login' || e === 'logout';
        });

        if (!other_types) {
          other_types = ['login', 'logout'];
        }
      }

      if (filter.questionnaires && q_activities.length > 0) {
        if (other_types.length > 0) {
          return await db.any(
            sqlSelectStatement +
              "AND (activity->>'type' IN ($4:csv) OR (activity->>'type' IN ($5:csv) AND activity->>'questionnaireID' IN ($6:csv)))",
            [
              probands,
              fromTime,
              toTime,
              other_types,
              q_activities,
              filter.questionnaires,
            ]
          );
        }

        return await db.any(
          sqlSelectStatement +
            "AND activity->>'type' IN ($4:csv) AND activity->>'questionnaireID' IN ($5:csv)",
          [probands, fromTime, toTime, q_activities, filter.questionnaires]
        );
      }

      if (filter.questionnaires) {
        return await db.any(
          sqlSelectStatement +
            "AND activity->>'type' IN ($4:csv) AND activity->>'questionnaireID' IN ($5:csv)",
          [probands, fromTime, toTime, activities, filter.questionnaires]
        );
      }

      return await db.any(
        sqlSelectStatement + "AND activity->>'type' IN ($4:csv)",
        [probands, fromTime, toTime, activities]
      );
    } catch (err) {
      console.log(err);
    }
  }

  /**
   *
   * @param {string} userId
   * @param {UserLogFilter} filter
   * @param {RepositoryOptions} options
   * @return {Promise<null>}
   */
  static async deleteLog(userId, filter, options) {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.none(
      'DELETE FROM user_logs WHERE user_id=$(userId) AND activity_timestamp BETWEEN $(fromTime) AND $(toTime)',
      {
        userId,
        fromTime: filter.fromTime,
        toTime: filter.toTime,
      }
    );
  }
}

module.exports = UserLogRepository;

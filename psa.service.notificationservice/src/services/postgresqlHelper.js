/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const startOfToday = require('date-fns/startOfToday');
const addDays = require('date-fns/addDays');
const addHours = require('date-fns/addHours');
const subDays = require('date-fns/subDays');

const { db } = require('../db');

const defaultEmailNotificationTime = '07:00';
const defaultEmailNotificationDay = 0;

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  function getActiveQuestionnaireInstances() {
    return db.manyOrNone(
      "SELECT * FROM questionnaire_instances WHERE notifications_scheduled=false AND status IN ('active', 'in_progress')"
    );
  }

  async function countOpenQuestionnaireInstances(username) {
    return (
      await db.one(
        `SELECT count(*)
                 FROM questionnaire_instances as qi
                          JOIN questionnaires as q
                               ON qi.questionnaire_id = q.id and qi.questionnaire_version = q.version
                 WHERE qi.status IN ('active', 'in_progress')
                   AND q.cycle_unit != 'spontan'
               AND qi.user_id = $(username)`,
        { username }
      )
    ).count;
  }

  function getQuestionnaireInstance(id) {
    return db.oneOrNone('SELECT * FROM questionnaire_instances WHERE id=$1', [
      id,
    ]);
  }

  function getUserNotificationSettings(user_id) {
    return db.one(
      'SELECT notification_time, compliance_labresults FROM users WHERE username=$1',
      [user_id]
    );
  }

  const latestQuestionnaireVersionQuery =
    '\
                        SELECT version FROM questionnaires WHERE id=$1 ORDER BY version DESC LIMIT 1 \
                    ';

  async function getQuestionnaireNotificationSettings(
    questionnaire_id,
    version
  ) {
    if (!version) {
      version = (
        await db.one(latestQuestionnaireVersionQuery, questionnaire_id)
      ).version;
    }
    return db.one(
      'SELECT notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_interval, notification_interval_unit, cycle_unit FROM questionnaires WHERE id=$1 AND version=$2',
      [questionnaire_id, version]
    );
  }

  function getTokenAndDeviceForUser(user_id) {
    return db.one(
      'SELECT fcm_token,logged_in_with,first_logged_in_at FROM users WHERE username=$1',
      [user_id]
    );
  }

  function updateFCMToken(user_id, token) {
    return db.one(
      'UPDATE users SET fcm_token=$1 WHERE username=$2 RETURNING fcm_token',
      [token, user_id]
    );
  }

  async function getTokenAndDeviceForUserIfAllowed(requester, username) {
    const role = await db.one('SELECT role FROM users WHERE username=$1', [
      requester,
    ]);
    if (role.role === 'SysAdmin') {
      return await db.one(
        'SELECT fcm_token,logged_in_with FROM users WHERE username=$1 AND role!=$2',
        [username, 'Proband']
      );
    } else {
      return await db.one(
        'SELECT fcm_token,logged_in_with FROM users WHERE username=${username} AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=${requester}))',
        { username: username, requester: requester }
      );
    }
  }

  async function getStudiesWithPMEmail() {
    return await db.manyOrNone(
      'SELECT * FROM studies WHERE pm_email IS NOT NULL'
    );
  }

  async function getStudiesWithHUBEmail() {
    return await db.manyOrNone(
      'SELECT * FROM studies WHERE hub_email IS NOT NULL'
    );
  }

  async function getNewSampledSamplesForStudy(study_id) {
    return await db.manyOrNone(
      'SELECT id FROM lab_results WHERE CAST(date_of_sampling AS TIMESTAMP) BETWEEN $1 AND $2 AND user_id=ANY(SELECT user_id FROM study_users WHERE study_id = $3)',
      [subDays(startOfToday(), 1), startOfToday(), study_id]
    );
  }

  async function getNewAnalyzedSamplesForStudy(study_id) {
    const queryString =
      'SELECT lr.id, user_id, dummy_sample_id FROM lab_results as lr ' +
      'LEFT JOIN (SELECT id, date_of_announcement, lab_result_id, MAX(date_of_announcement) FROM lab_observations GROUP BY id) lo on lr.id = lo.lab_result_id ' +
      'WHERE CAST(date_of_announcement AS TIMESTAMP) BETWEEN $1 AND $2 ' +
      'AND user_id=ANY(SELECT user_id FROM study_users WHERE study_id = $3)';
    return await db.manyOrNone(queryString, [
      subDays(startOfToday(), 1),
      startOfToday(),
      study_id,
    ]);
  }

  async function markInstanceAsScheduled(id) {
    return await db.none(
      'UPDATE questionnaire_instances SET notifications_scheduled=$1 WHERE id=$2',
      [true, id]
    );
  }

  async function insertNotificationSchedule(schedule) {
    return await db.none(
      'INSERT INTO notification_schedules(user_id, send_on, notification_type, reference_id) VALUES($1:csv)',
      [schedule]
    );
  }

  async function insertCustomNotificationSchedule(schedule) {
    return await db.one(
      'INSERT INTO notification_schedules(user_id, send_on, notification_type, reference_id, title, body) VALUES($1:csv) RETURNING *',
      [schedule]
    );
  }

  async function getAllDueNotifications() {
    return await db.manyOrNone(
      'SELECT * FROM notification_schedules WHERE send_on < $1',
      [new Date()]
    );
  }

  async function getAllNotificationsForUser(user_id) {
    // Only get qReminder schedules for questionnaires that have no hourly cycle
    return await db.manyOrNone(
      `SELECT *
             FROM notification_schedules
             WHERE user_id = $1
               AND (
                 notification_type != $2 OR (
                     notification_type = $2 AND reference_id:: int IN (
                     SELECT id FROM questionnaire_instances WHERE questionnaire_id IN (
                     SELECT id FROM questionnaires WHERE cycle_unit != $3
                     )
                     )
                     )
                 )`,
      [user_id, 'qReminder', 'hour']
    );
  }

  async function getNotificationById(id) {
    return await db.one('SELECT * FROM notification_schedules WHERE id=$1', [
      id,
    ]);
  }

  async function updateTimeForNotification(id, date) {
    return await db.none(
      'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
      [date, id]
    );
  }

  async function deleteScheduledNotification(id) {
    return await db.none('DELETE FROM notification_schedules WHERE id=$1', [
      id,
    ]);
  }

  async function deleteScheduledNotificationByInstanceId(id) {
    return await db.none(
      'DELETE FROM notification_schedules WHERE reference_id=$1 AND notification_type=$2',
      [id, 'qReminder']
    );
  }

  async function postponeNotificationByInstanceId(id) {
    return db.tx(async (t) => {
      const notifications = await t.manyOrNone(
        'SELECT * FROM notification_schedules WHERE reference_id=$1 AND notification_type=$2',
        [id, 'qReminder']
      );
      for (let i = 0; i < notifications.length; i++) {
        await t.none(
          'UPDATE notification_schedules SET send_on=$1 WHERE id=$2 AND notification_type=$3',
          [
            addDays(new Date(notifications[i].send_on), 1),
            notifications[i].id,
            'qReminder',
          ]
        );
      }
      return;
    });
  }

  async function postponeNotification(id) {
    return db.tx(async (t) => {
      const notification = await t.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [id]
      );
      return await t.none(
        'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
        [addDays(new Date(notification.send_on), 1), notification.id]
      );
    });
  }

  async function postponeNotificationByOneHour(id) {
    return db.tx(async (t) => {
      const notification = await t.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [id]
      );
      return await t.none(
        'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
        [addHours(new Date(notification.send_on), 1), notification.id]
      );
    });
  }

  async function getLabResult(id) {
    return await db.one('SELECT * FROM lab_results WHERE id=$1', [id]);
  }

  async function hasAnswersNotifyFeature(questionnaireInstanceId) {
    const ret = await db.oneOrNone(
      'SELECT questionnaire_instances.id as id  FROM questionnaire_instances, studies ' +
        'WHERE questionnaire_instances.id=$1 AND questionnaire_instances.study_id=studies.name AND ' +
        'studies.has_answers_notify_feature=true',
      [questionnaireInstanceId]
    );
    return ret && ret.id ? true : false;
  }

  async function isNotableAnswer(answerOptionId, answerValue) {
    const ret = await db.oneOrNone(
      'SELECT is_notable, values FROM answer_options ' +
        'WHERE answer_options.id=$1',
      [answerOptionId]
    );
    answerValue = answerValue.split(';');
    if (ret) {
      const values = ret.values;
      const is_notable = ret.is_notable;
      for (let i = 0; i < values.length; i++) {
        if (answerValue.includes(values[i])) {
          return is_notable[i];
        }
      }
    }
    return false;
  }

  async function insertContactProbandRecordForNotableAnswer(
    questionnaireInstanceId
  ) {
    const retUserId = await db.one(
      'SELECT user_id FROM questionnaire_instances ' + 'WHERE id=$1',
      [questionnaireInstanceId]
    );
    const userId = retUserId.user_id;
    const retCheckExists = await db.oneOrNone(
      'SELECT id FROM users_to_contact ' +
        'WHERE user_id=$1 AND now()::timestamp::date=created_at::timestamp::date',
      [userId]
    );
    // Insert a new record only on every new day, otherwise updates the record
    if (!retCheckExists || !retCheckExists.id) {
      return await db.oneOrNone(
        'INSERT INTO users_to_contact (user_id, notable_answer_questionnaire_instances, is_notable_answer, ' +
          'is_notable_answer_at ,processed) ' +
          'VALUES ($1, $2, $3, to_timestamp($4), $5)',
        [userId, [questionnaireInstanceId], true, Date.now() / 1000.0, false]
      );
    } else {
      return await db.oneOrNone(
        'UPDATE users_to_contact SET is_notable_answer=$1, is_notable_answer_at=to_timestamp($2)' +
          ', processed=$3, notable_answer_questionnaire_instances=array_append(notable_answer_questionnaire_instances,$4) ' +
          'WHERE id=$5 AND NOT ($4=ANY(notable_answer_questionnaire_instances))',
        [
          true,
          Date.now() / 1000.0,
          false,
          questionnaireInstanceId,
          retCheckExists.id,
        ]
      );
    }
  }

  async function getQuestionnaireInstanceAnswers(questionnaireInstanceId) {
    const email = await db.manyOrNone(
      'SELECT * FROM answers ' + 'WHERE questionnaire_instance_id=$1',
      [questionnaireInstanceId]
    );
    return email;
  }

  async function getNotFilledoutQuestionnaireInstanceIds() {
    const ids = [];
    const query =
      'SELECT questionnaire_instances.id AS id, questionnaire_instances.date_of_issue AS date_of_issue, ' +
      'questionnaires.notify_when_not_filled_time as notify_when_not_filled_time, questionnaires.notify_when_not_filled_day as notify_when_not_filled_day ' +
      'FROM questionnaire_instances, questionnaires ' +
      "WHERE (questionnaire_instances.status = 'in_progress' OR questionnaire_instances.status = 'active' OR questionnaire_instances.status = 'expired') " +
      'AND questionnaires.notify_when_not_filled=true AND questionnaire_instances.questionnaire_id=questionnaires.id ' +
      'AND NOT EXISTS (SELECT id FROM users_to_contact WHERE questionnaire_instances.id=ANY(users_to_contact.not_filledout_questionnaire_instances) ' +
      'AND now()::timestamp::date=users_to_contact.created_at::timestamp::date)';
    const ret = await db.manyOrNone(query);
    if (ret && ret.length > 0) {
      for (let i = 0; i < ret.length; i++) {
        const id = ret[i].id;

        if (!ret[i].notify_when_not_filled_time) {
          ret[i].notify_when_not_filled_time = defaultEmailNotificationTime;
        }

        if (!ret[i].notify_when_not_filled_day) {
          ret[i].notify_when_not_filled_day = defaultEmailNotificationDay;
        }

        const time = ret[i].notify_when_not_filled_time.split(':');
        const day = ret[i].notify_when_not_filled_day;
        const issueDate = ret[i].date_of_issue;
        const notificationDate = new Date(issueDate);
        notificationDate.setHours(time[0], time[1], 0);
        notificationDate.setDate(notificationDate.getDate() + day);
        if (Date.now() > notificationDate.getTime()) {
          ids.push(id);
        }
      }
    }
    return ids;
  }

  async function insertContactProbandRecordForNotAnswered(data) {
    const retUserId = await db.one(
      'SELECT user_id FROM questionnaire_instances ' + 'WHERE id=$1',
      [data.questionnaireInstanceId]
    );
    const userId = retUserId.user_id;
    const retCheckExists = await db.oneOrNone(
      'SELECT id FROM users_to_contact ' +
        'WHERE user_id=$1 AND now()::timestamp::date=created_at::timestamp::date',
      [userId]
    );
    // Insert a new record only on every new day, otherwise updates the record
    if (!retCheckExists || !retCheckExists.id) {
      return await db.oneOrNone(
        'INSERT INTO users_to_contact (user_id, not_filledout_questionnaire_instances, is_not_filledout, ' +
          'is_not_filledout_at ,processed) ' +
          'VALUES ($1, $2, $3, to_timestamp($4), $5)',
        [
          userId,
          [data.questionnaireInstanceId],
          true,
          Date.now() / 1000.0,
          false,
        ]
      );
    } else {
      // Remove questionnaireInstanceId duplicates
      return await db.oneOrNone(
        'UPDATE users_to_contact SET is_not_filledout=$1, is_not_filledout_at=to_timestamp($2)' +
          ', processed=$3, not_filledout_questionnaire_instances=array_append(not_filledout_questionnaire_instances,$4) ' +
          'WHERE id=$5 AND NOT ($4=ANY(not_filledout_questionnaire_instances))',
        [
          true,
          Date.now() / 1000.0,
          false,
          data.questionnaireInstanceId,
          retCheckExists.id,
        ]
      );
    }
  }

  async function getDailyAggregatorEmailStats() {
    const stats = new Map();
    const activeStudiesWithNotifByEmail = await db.manyOrNone(
      'SELECT name,pm_email FROM studies ' +
        "WHERE has_answers_notify_feature_by_mail=true AND status='active'"
    );

    if (
      activeStudiesWithNotifByEmail &&
      activeStudiesWithNotifByEmail.length > 0
    ) {
      activeStudiesWithNotifByEmail.forEach((value) => {
        stats.set(value.name, {
          questionnairesWithNotableAnswersNum: 0,
          notFinishedQuestionnairesNum: 0,
          email: value.pm_email,
        });
      });
    } else {
      return stats;
    }
    const res1 = await db.manyOrNone(
      'SELECT COUNT(DISTINCT u.user_id), s.name FROM studies AS s,questionnaire_instances AS q, users_to_contact as u \n' +
        "WHERE q.id=ANY(u.notable_answer_questionnaire_instances) AND (u.created_at>=NOW() - INTERVAL '24 HOURS') \n" +
        "AND s.has_answers_notify_feature_by_mail=true AND s.status='active' \n" +
        'AND q.study_id=s.name \n' +
        'GROUP BY s.name\n'
    );

    if (res1 && res1.length > 0) {
      for (let i = 0; i < res1.length; i++) {
        stats.get(res1[i].name).questionnairesWithNotableAnswersNum =
          res1[i].count;
      }
    }
    const res2 = await db.manyOrNone(
      'SELECT COUNT(DISTINCT u.user_id), s.name FROM studies AS s,questionnaire_instances AS q, users_to_contact as u \n' +
        "WHERE q.id=ANY(u.not_filledout_questionnaire_instances) AND (u.created_at>=NOW() - INTERVAL '24 HOURS') \n" +
        "AND s.has_answers_notify_feature_by_mail=true AND s.status='active' \n" +
        'AND q.study_id=s.name \n' +
        'GROUP BY s.name\n'
    );

    if (res2 && res2.length > 0) {
      for (let i = 0; i < res2.length; i++) {
        stats.get(res2[i].name).notFinishedQuestionnairesNum = res2[i].count;
      }
    }
    return stats;
  }

  return {
    /**
     * @function
     * @description gets all questionnaire instances with status=active
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found questionnaire instances or empty array response if it does not exist
     */
    getActiveQuestionnaireInstances: getActiveQuestionnaireInstances,

    /**
     * @function
     * @description counts the number of all non spontaneous QI of a proband with status=active or in_progress
     * @memberof module:postgresqlHelper
     * @param {string} username Name of the proband
     * @returns {Promise} a resolved promise with the found questionnaire instances or empty array response if it does not exist
     */
    countOpenQuestionnaireInstances: countOpenQuestionnaireInstances,

    /**
     * @function
     * @description gets the questionnaire instance with the specified id
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire instance to get
     * @returns {Promise} a resolved promise with the found questionnaire instance rejected promise otherwise
     */
    getQuestionnaireInstance: getQuestionnaireInstance,

    /**
     * @function
     * @description gets the notification settings of a user
     * @memberof module:postgresqlHelper
     * @param {string} user_id the id of the user to get settings for
     * @returns {Promise} a resolved promise with the found settings or rejected promise otherwise
     */
    getUserNotificationSettings: getUserNotificationSettings,

    /**
     * @function
     * @description gets the notification settings of a questionnaire
     * @memberof module:postgresqlHelper
     * @param {number} questionnaire_id the id of the questionnaire to get settings for
     * @returns {Promise} a resolved promise with the found settings or rejected promise otherwise
     */
    getQuestionnaireNotificationSettings: getQuestionnaireNotificationSettings,

    /**
     * @function
     * @description gets the fcm token of the specified user
     * @memberof module:postgresqlHelper
     * @param {string} user_id the name of the user to get the token for
     * @returns {Promise} a resolved promise with the found token and device type or rejected promise otherwise
     */
    getTokenAndDeviceForUser: getTokenAndDeviceForUser,

    /**
     * @function
     * @description updates the specified users fcm token
     * @memberof module:postgresqlHelper
     * @param {string} user_id the name of the user to get the token for
     * @param {string} token the new token
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    updateFCMToken: updateFCMToken,

    /**
     * @function
     * @description gets the requested fcm_token if the user is allowed to
     * @memberof module:postgresqlHelper
     * @param {string} requester the requesting user
     * @param {string} username the requested user
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getTokenAndDeviceForUserIfAllowed: getTokenAndDeviceForUserIfAllowed,

    /**
     * @function
     * @description gets all studies with set pm email
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudiesWithPMEmail: getStudiesWithPMEmail,

    /**
     * @function
     * @description gets all studies with set hub email
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudiesWithHUBEmail: getStudiesWithHUBEmail,

    /**
     * @function
     * @description gets all samples for a study that were sampled yesterday
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study to get samples for
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getNewSampledSamplesForStudy: getNewSampledSamplesForStudy,

    /**
     * @function
     * @description gets all samples for a study that were analyzed yesterday
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study to get samples for
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getNewAnalyzedSamplesForStudy: getNewAnalyzedSamplesForStudy,

    /**
     * @function
     * @description updates the questionnaire instance to having been scheduled
     * @memberof module:postgresqlHelper
     * @param {number} id the instance id to update
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    markInstanceAsScheduled: markInstanceAsScheduled,

    /**
     * @function
     * @description inserts a notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} schedule the schedule to insert
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    insertNotificationSchedule: insertNotificationSchedule,

    /**
     * @function
     * @description inserts a custom notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} schedule the schedule to insert
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    insertCustomNotificationSchedule: insertCustomNotificationSchedule,

    /**
     * @function
     * @description gets all scheduled notifications from the past
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getAllDueNotifications: getAllDueNotifications,

    /**
     * @function
     * @description gets the notification schedule for the user
     * @memberof module:postgresqlHelper
     * @param {number} user_id the users id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getAllNotificationsForUser: getAllNotificationsForUser,

    /**
     * @function
     * @description gets the notification schedule for given Id
     * @memberof module:postgresqlHelper
     * @param {number} id the schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getNotificationById: getNotificationById,

    /**
     * @function
     * @description updates the date of the notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @param {number} date the new date
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    updateTimeForNotification: updateTimeForNotification,

    /**
     * @function
     * @description deletes the notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    deleteScheduledNotification: deleteScheduledNotification,

    /**
     * @function
     * @description deletes the notification schedules associated with the instance
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule instance id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    deleteScheduledNotificationByInstanceId:
      deleteScheduledNotificationByInstanceId,

    /**
     * @function
     * @description postpones the notification schedules associated with the instance by 1 day
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule instance id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotificationByInstanceId: postponeNotificationByInstanceId,

    /**
     * @function
     * @description postpones the notification schedule with id
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotification: postponeNotification,

    /**
     * @function
     * @description postpones the notification schedule with id
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotificationByOneHour: postponeNotificationByOneHour,

    /**
     * @function
     * @description gets the labresult
     * @memberof module:postgresqlHelper
     * @param {number} id the labresult id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getLabResult: getLabResult,

    /**
     * @function
     * @description check if the notification feature enable for the given study
     * @memberof module:postgresqlHelper
     * @param {number} questionnaireInstanceId the id the of questionnaire instance
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    hasAnswersNotifyFeature: hasAnswersNotifyFeature,

    /**
     * @function
     * @description checks if given answer should be notified upon
     * @memberof module:postgresqlHelper
     * @param {number} answerOptionId the id of the answer option
     * @param {string} answerValue the value of the answer
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    isNotableAnswer: isNotableAnswer,

    /**
     * @function
     * @description inserts a new proband to contact record in db
     * @memberof module:postgresqlHelper
     * @param {questionnaireInstanceId} the questionnaire instance id
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    insertContactProbandRecordForNotableAnswer:
      insertContactProbandRecordForNotableAnswer,

    /**
     * @function
     * @description gets a list of the given questionnaire instance answers
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    getQuestionnaireInstanceAnswers: getQuestionnaireInstanceAnswers,

    /**
     * @function
     * @description gets questionnaire instancs that are yet to be fully answered
     * @memberof module:postgresqlHelper
     * @param {array} list of questionnaire instance IDs
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    getNotFilledoutQuestionnaireInstanceIds:
      getNotFilledoutQuestionnaireInstanceIds,

    /**
     * @function
     * @description inserts a new proband to contact record in db
     * @memberof module:postgresqlHelper
     * @param {object} the new record data
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    insertContactProbandRecordForNotAnswered:
      insertContactProbandRecordForNotAnswered,

    /**
     * @function
     * @description retrieves statistical aggregation for all active studies
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    getDailyAggregatorEmailStats: getDailyAggregatorEmailStats,
  };
})();

module.exports = postgresqlHelper;

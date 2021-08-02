/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { db } = require('../db');
const subHours = require('date-fns/subHours');

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  const returningUserFields =
    'RETURNING username,role,initial_password_validity_date,pw_change_needed, account_status';

  function getUserAllData(username) {
    return db.oneOrNone('SELECT * FROM users WHERE username = $(username)', {
      username,
    });
  }

  async function getUserStudies(username) {
    const studies = await db.manyOrNone(
      'SELECT study_id FROM study_users WHERE user_id = $(username) ORDER BY study_id',
      { username: username }
    );
    return studies.map((study) => study.study_id);
  }

  function createUser(user) {
    return db.one(
      `INSERT INTO users(username, password, salt, role, initial_password_validity_date, pw_change_needed, account_status) VALUES ($(username), $(password), $(salt), $(role), $(initial_password_validity_date), $(pw_change_needed), $(account_status)) ${returningUserFields}`,
      {
        username: user.username,
        password: user.password,
        salt: user.salt,
        role: user.role,
        initial_password_validity_date: user.initial_password_validity_date,
        pw_change_needed: user.pw_change_needed,
        account_status: user.account_status,
      }
    );
  }

  function updateUser(user) {
    const fields = [
      { sql: 'username', obj: 'new_username' },
      { sql: 'password', obj: 'password' },
      { sql: 'salt', obj: 'salt' },
      { sql: 'role', obj: 'role' },
      {
        sql: 'initial_password_validity_date',
        obj: 'initial_password_validity_date',
      },
      { sql: 'pw_change_needed', obj: 'pw_change_needed' },
      { sql: 'account_status', obj: 'account_status' },
    ];

    const statements = [];
    const data = {
      username: user.username,
    };

    for (const field of fields) {
      if (user[field.obj] !== undefined) {
        statements.push(`${field.sql}=$(${field.obj})`);
        data[field.obj] = user[field.obj];
      }
    }

    if (statements.length === 0) {
      return Promise.resolve();
    }

    const query = `UPDATE users SET ${statements.join(
      ', '
    )} WHERE username=$(username) ${returningUserFields}`;
    return db.one(query, data);
  }

  async function deleteAllDuePasswords(validityPeriod) {
    const deletedPasswords = await db.manyOrNone(
      'DELETE FROM planned_probands WHERE activated_at < $1 RETURNING user_id',
      [subHours(new Date(), validityPeriod)]
    );
    console.log('Deleted ' + deletedPasswords.length + ' passwords');
  }

  function updateUserPasswordOnChangeReq(
    newPassword,
    salt,
    pwChangeNeeded,
    username
  ) {
    return db.one(
      'UPDATE users SET password = $1, salt = $2, pw_change_needed = $3, initial_password_validity_date=NULL WHERE username = $4 RETURNING * ',
      [newPassword, salt, pwChangeNeeded, username]
    );
  }

  function updateUserPasswordOnLogin(passwordHash, salt, username) {
    return db.one(
      'UPDATE users SET password = $1, salt = $2 WHERE username = $3 RETURNING *',
      [passwordHash, salt, username]
    );
  }

  function updateUserOnLogout(username) {
    return db.oneOrNone(
      'UPDATE users SET fcm_token = $1 WHERE username = $2 RETURNING *',
      ['', username]
    );
  }

  function updateUserLoginAttemptsAfterLogin(
    logged_in_with,
    first_logged_in_at,
    username
  ) {
    return db.one(
      'UPDATE users SET logged_in_with = $1, first_logged_in_at = $2, number_of_wrong_attempts = 0, third_wrong_password_at = NULL WHERE username = $3 RETURNING *',
      [logged_in_with, first_logged_in_at, username]
    );
  }

  function updateNumberOfWrongLoginAttempts(
    number_of_wrong_attempts_new_value,
    third_wrong_password_at_new_value,
    username
  ) {
    return db.one(
      'UPDATE users SET number_of_wrong_attempts = $1, third_wrong_password_at = $2 WHERE username = $3 RETURNING *',
      [
        number_of_wrong_attempts_new_value,
        third_wrong_password_at_new_value,
        username,
      ]
    );
  }

  async function getAllowedIPs(remoteIPs, role) {
    return await db.manyOrNone(
      'SELECT * FROM allowed_ips WHERE ip IN ($1:csv) AND allowed_role = $2',
      [remoteIPs, role]
    );
  }

  return {
    /**
     * @function
     * @description gets the user with the specified username and selects all data
     * @memberof module:postgresqlHelper
     * @param {string} username the username of the user to find
     * @returns {Promise} a resolved promise with the found user or a rejected promise with the error
     */
    getUserAllData: getUserAllData,

    /**
     * @function
     * @description gets the studies of that user
     * @memberof module:postgresqlHelper
     * @param {string} username the username
     * @returns {Promise} a resolved promise with the found studies for that user
     */
    getUserStudies: getUserStudies,

    /**
     * @function
     * @description creates the user
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the created user or a rejected promise with the error
     */
    createUser: createUser,

    /**
     * @function
     * @description updates the user
     * @memberof module:postgresqlHelper
     */
    updateUser: updateUser,

    /**
     * @function
     * @description deletes all due passwords
     * @memberof module:postgresqlHelper
     * @param {number} the validity period (in hours) for the first-time generated passwords
     * @returns {Promise} a resolved promise with the users study accesses or a rejected promise with the error
     */
    deleteAllDuePasswords: deleteAllDuePasswords,

    /**
     * @description updates the user password if a password change has been requested
     * @memberof module:postgresqlHelper
     * @param {String} newPassword the password which shall be updated
     * @param {String} salt the new salt for the password
     * @param {Boolean} pwChangeNeeded provides information if a change was requested or not
     * @param {String} username the username who requested the password change
     * @returns {Promise} a resolved promise returning the complete user
     */
    updateUserPasswordOnChangeReq: updateUserPasswordOnChangeReq,

    /**
     * @function
     * @description updates the user password on login if the password still uses the old hashing method
     * @memberof module:postgresqlHelper
     * @param {String} password the password which shall be updated
     * @param {String} salt the new salt for the password
     * @param {String} username the username who logged in
     * @returns {Promise} a resolved promise returning the complete user
     */
    updateUserPasswordOnLogin: updateUserPasswordOnLogin,

    /**
     * @function
     * @description updates the user after logout
     * @memberof module:postgresqlHelper
     * @param {String} username of the user who used the logout function
     * @returns {Promise} a resolved promise returning the complete user
     */
    updateUserOnLogout: updateUserOnLogout,

    /**
     * @function
     * @description updates the users login attempts after a successful login
     * @memberof module:postgresqlHelper
     * @param {String} logged_in_with device used to login
     * @param {Date} first_logged_in_at time of the first login attempt
     * @param {String} username the username who logged in
     * @returns {Promise} a resolved promise returning the complete user
     */
    updateUserLoginAttemptsAfterLogin: updateUserLoginAttemptsAfterLogin,

    /**
     * @function
     * @description updates the users number of wrong login attempts
     * @memberof module:postgresqlHelper
     * @param {Number} number_of_wrong_attempts_new_value is the number of wrong login attempts
     * @param {Date} third_wrong_password_at_new_value time of the last wrong login attemp
     * @param {String} username the username who logged in
     * @returns {Promise} a resolved promise returning the complete user
     */
    updateNumberOfWrongLoginAttempts: updateNumberOfWrongLoginAttempts,

    /**
     * @function
     * @description get the allowed IP address
     * @memberof module:postgresqlHelper
     * @param {Array} remoteIPs IP addresses associated with the role
     * @param {string} role role of the user
     * @returns {Promise} a resolved promise returning all allowed IP-Address Data.
     */
    getAllowedIPs: getAllowedIPs,
  };
})();

module.exports = postgresqlHelper;

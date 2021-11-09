/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { config } = require('../config');
const pwHashesHelper = require('../helpers/pwHashesHelper.js');
const { MailService } = require('@pia/lib-service-core');
const pgHelper = require('../services/postgresqlHelper.js');
const personaldataserviceClient = require('../clients/personaldataserviceClient');
const {
  SecureRandomPasswordService,
} = require('../services/secureRandomPasswordService');

/**
 * @description HAPI Handler for change password
 */
const changePasswordHandler = (function () {
  async function changePassword(request) {
    const oldPassword = request.payload.oldPassword;
    const newPassword1 = request.payload.newPassword1;
    const newPassword2 = request.payload.newPassword2;

    const username = request.auth.credentials.username;
    const role = request.auth.credentials.role;

    if (role !== 'Proband' && (newPassword1 === '' || newPassword2 === '')) {
      return Boom.forbidden('Only probands can deselect their passwords');
    }
    if (newPassword1 !== newPassword2) {
      return Boom.badData('New passwords must match');
    }
    try {
      const userData = await pgHelper.getUserAllData(username);
      if (!userData) {
        return Boom.notFound('The user does not exist');
      }
      if (
        userData.password !==
        pwHashesHelper.hashThePasswordWithSaltAndPepper(
          oldPassword,
          userData.salt
        ).passwordHash
      ) {
        return Boom.forbidden('The old password does not match');
      }
      const updatedPw =
        pwHashesHelper.createHashedPasswordWithSaltAndPepper(newPassword1);
      const updatedUserData = await pgHelper.updateUserPasswordOnChangeReq(
        updatedPw.passwordHash,
        updatedPw.salt,
        false,
        username
      );
      return {
        username: request.payload.username,
        role: updatedUserData.role,
        compliance_labresults: updatedUserData.compliance_labresults,
        first_logged_in_at: updatedUserData.first_logged_in_at,
        pw_change_needed: updatedUserData.pw_change_needed,
      };
    } catch (err) {
      request.log(['changePassword', 'error'], err);
      return Boom.internal('Could not make request to db');
    }
  }

  /**
   *
   * @param request { import('@types/hapi__hapi').Request }
   * @return {Promise<Boom<unknown>|string>}
   */
  async function newPassword(request) {
    let user_id;
    if (request.auth.isAuthenticated) {
      user_id = request.auth.credentials.username;
      request.log('newPassword', 'Using username from token.');
    } else {
      user_id = request.payload.user_id;
      request.log('newPassword', 'Using username from request.');
    }

    if (!user_id) {
      return Boom.notFound('Could not find Username.');
    }
    // nobody should be able to use this function check if a user exists -> therefore return 'successfullyChanged' as if the user exists
    const successfullyChanged =
      'Falls es sich um einen gültigen Benutzer mit bekannter E-Mail-Adresse handelt, wurde eine Email mit einem neuem Passwort versandt.';

    try {
      const user = await pgHelper.getUserAllData(user_id);
      if (!user) {
        request.log('newPassword', 'User does not exist in DB.');
        return successfullyChanged;
      }
      let email;
      if (user.role !== 'Proband') {
        email = user_id;
      } else {
        email = await personaldataserviceClient
          .getPersonalDataEmail(user_id)
          .catch((err) => {
            if (err.output.statusCode === 404) return null;
            else throw err;
          });
      }

      if (!email) {
        request.log('newPassword', 'There was no email address');
        return successfullyChanged;
      }
      const newUserPw = SecureRandomPasswordService.generate();
      const newUserSecurity =
        pwHashesHelper.createHashedPasswordWithSaltAndPepper(newUserPw);

      await MailService.sendMail(email, createNewPasswordMail(newUserPw)).catch(
        (err) => request.log('newPassword', 'Unable to send mail: ' + err.stack)
      );
      await pgHelper
        .updateUserPasswordOnChangeReq(
          newUserSecurity.passwordHash,
          newUserSecurity.salt,
          true,
          user_id
        )
        .catch((err) =>
          request.log('newPassword', 'Unable to update password: ' + err.stack)
        );
      request.log('newPassword', 'Email was successfully send.');
      return successfullyChanged;
    } catch (err) {
      request.log(['newPassword', 'error'], err);
      return successfullyChanged;
    }
  }

  function createNewPasswordMail(password) {
    return {
      subject:
        'PIA (inkl. Symptomtagebuch) - Sie haben ein neues Passwort angefordert',
      text:
        'Liebe:r Nutzer:in,\n\n' +
        'Sie haben vor Kurzem ein neues Passwort angefordert\n\n' +
        'Ihr neues Passwort lautet: ' +
        password +
        '\n\nSie können sich ab sofort unter "' +
        config.webappUrl +
        '" oder in der mobilen App mit Ihrem Nutzernamen und dem obigen Passwort anmelden.\n' +
        'Sie werden daraufhin aufgefordert Ihr neues Passwort zu ändern.',
      html:
        'Liebe:r Nutzer:in,<br><br>' +
        'Sie haben vor Kurzem ein neues Passwort angefordert<br><br>' +
        'Ihr neues Passwort lautet: <h4>' +
        password +
        '</h4><br>' +
        'Sie können sich ab sofort unter <a href="' +
        config.webappUrl +
        '">PIA Webapp</a> oder in der mobilen App mit Ihrem Nutzernamen und dem obigen Passwort anmelden.<br>' +
        'Sie werden daraufhin aufgefordert Ihr neues Passwort zu ändern.',
    };
  }

  return {
    /**
     * @function
     * @description changes the users password
     * @memberof module:changePasswordHandler
     */
    changePassword: changePassword,

    /**
     * @function
     * @description requests a new password
     * @memberof module:changePasswordHandler
     */
    newPassword: newPassword,
  };
})();

module.exports = changePasswordHandler;

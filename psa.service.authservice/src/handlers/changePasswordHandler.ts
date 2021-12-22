/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { config } from '../config';
import { PwHashesHelper } from '../helpers/pwHashesHelper';
import {
  AccessToken,
  LoginToken,
  MailContent,
  MailService,
} from '@pia/lib-service-core';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { SecureRandomPasswordService } from '../services/secureRandomPasswordService';
import { Lifecycle } from '@hapi/hapi';
import { getRepository } from 'typeorm';
import { Account } from '../entities/account';
import { StatusCodes } from 'http-status-codes';

interface PasswordChangeRequest {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
}
interface NewPasswordRequest {
  user_id: string;
}

/**
 * changes the users password
 */
export const changePassword: Lifecycle.Method = async (request) => {
  const { oldPassword, newPassword1, newPassword2 } =
    request.payload as PasswordChangeRequest;

  const { username, role } = request.auth.credentials as AccessToken;

  if (role !== 'Proband' && (newPassword1 === '' || newPassword2 === '')) {
    return Boom.forbidden('Only probands can deselect their passwords');
  }
  if (newPassword1 !== newPassword2) {
    return Boom.badData('New passwords must match');
  }
  const accountRepo = getRepository(Account);
  try {
    const userAccount = await accountRepo.findOne(username);
    if (!userAccount) {
      return Boom.notFound('The user does not exist');
    }
    if (
      userAccount.password !==
      PwHashesHelper.hashThePasswordWithSaltAndPepper(
        oldPassword,
        userAccount.salt
      )
    ) {
      return Boom.forbidden('The old password does not match');
    }
    const updatedPw =
      PwHashesHelper.createHashedPasswordWithSaltAndPepper(newPassword1);
    userAccount.password = updatedPw.passwordHash;
    userAccount.salt = updatedPw.salt;
    userAccount.pwChangeNeeded = false;
    await accountRepo.save(userAccount);
    return {
      username: username,
      role: userAccount.role,
      pw_change_needed: userAccount.pwChangeNeeded,
    };
  } catch (err) {
    request.log(['changePassword', 'error'], err as Error);
    return Boom.internal('Could not make request to db');
  }
};

/**
 * newPassword
 */
export const newPassword: Lifecycle.Method = async (request) => {
  let username;
  if (request.auth.isAuthenticated) {
    username = (request.auth.credentials as LoginToken).username;
    request.log('newPassword', 'Using username from token.');
  } else {
    username = (request.payload as NewPasswordRequest).user_id;
    request.log('newPassword', 'Using username from request.');
  }

  if (!username) {
    return Boom.notFound('Could not find Username.');
  }
  // nobody should be able to use this function check if a user exists -> therefore return 'successfullyChanged' as if the user exists
  const successfullyChanged =
    'Falls es sich um einen gültigen Benutzer mit bekannter E-Mail-Adresse handelt, wurde eine Email mit einem neuem Passwort versandt.';

  const accountRepo = getRepository(Account);
  try {
    const userAccount = await accountRepo.findOne(username);
    if (!userAccount) {
      request.log('newPassword', 'User does not exist in DB.');
      return successfullyChanged;
    }
    let email;
    if (userAccount.role !== 'Proband') {
      email = username;
    } else {
      email = await personaldataserviceClient
        .getPersonalDataEmail(username)
        .catch((err) => {
          if (
            err instanceof Boom.Boom &&
            err.output.statusCode === StatusCodes.NOT_FOUND
          )
            return null;
          else throw err;
        });
    }

    if (!email) {
      request.log('newPassword', 'There was no email address');
      return successfullyChanged;
    }
    const newUserPw = SecureRandomPasswordService.generate();
    const newUserSecurity =
      PwHashesHelper.createHashedPasswordWithSaltAndPepper(newUserPw);

    await MailService.sendMail(email, createNewPasswordMail(newUserPw)).catch(
      (err) =>
        request.log(
          'newPassword',
          'Unable to send mail: ' + (err as Error).toString()
        )
    );

    userAccount.password = newUserSecurity.passwordHash;
    userAccount.salt = newUserSecurity.salt;
    userAccount.pwChangeNeeded = true;
    userAccount.initialPasswordValidityDate = null;
    await accountRepo
      .save(userAccount)
      .catch((err) =>
        request.log(
          'newPassword',
          'Unable to update password: ' + (err as Error).toString()
        )
      );
    request.log('newPassword', 'Email was successfully send.');
    return successfullyChanged;
  } catch (err) {
    request.log(['newPassword', 'error'], err as Error);
    return successfullyChanged;
  }
};

function createNewPasswordMail(password: string): MailContent {
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

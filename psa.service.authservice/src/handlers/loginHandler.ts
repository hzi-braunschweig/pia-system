/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { PwHashesHelper } from '../helpers/pwHashesHelper';
import * as fakeUserService from '../services/fakeUserService';
import * as localeHelper from '../helpers/localeHelper';
import { JwtService } from '../services/jwtService';

import { config } from '../config';
import { Request } from '@hapi/hapi';
import { Role } from '../models/role';
import { getRepository, In } from 'typeorm';
import { AllowedIp } from '../entities/allowedIps';
import { LoginToken } from '@pia/lib-service-core';
import { Account, BasicAccount } from '../entities/account';
import { messageQueueService } from '../services/messageQueueService';

type CertRoleMapping = Record<string, Role>;

const ouToRole: CertRoleMapping = {
  EinwilligungsManager: 'EinwilligungsManager',
  Untersuchungsteam: 'Untersuchungsteam',
  Probandenmanagement: 'ProbandenManager',
  Forscherteam: 'Forscher',
  Systemadministrator: 'SysAdmin',
};

const CERT_ROLE_PREFIX = 'OU=';
const MILLISECONDS_PER_SECOND = 1000;
const MAX_NUMBER_OF_WRONG_ATTEMPTS = 3;
const SECONDS_TO_WAIT = 300;

interface LoginRequest {
  logged_in_with: 'web' | 'ios' | 'android';
  password: string;
  username?: string;
  locale?: string;
}

interface LoginResponse {
  token: string;
  username: string; // deprecated: not used in newer apps
  role: Role; // deprecated: not used in newer apps
  token_login?: string;
  pw_change_needed?: boolean;
}

async function isRequestAllowed(
  request: Request,
  role: Role
): Promise<boolean> {
  let validIP = false;
  let validCert = false;
  let checkISEnabled = false;

  // Cert check
  if (config.certCheckEnabled) {
    checkISEnabled = true;
    const xCCU = request.headers['x-client-certificate-used']; // e.g. '1' => true, it is used
    const xCCV = request.headers['x-client-certificate-validated']; // e.g. '0' => valid, no error code

    request.log(
      'login',
      'scanning request headers for valid cert for role: ' + role
    );
    if (xCCU && xCCU === '1') {
      if (xCCV && xCCV === '0') {
        // Do role check
        const xCDN = request.headers['x-ssl-client-dn']; // e.g. '/C=DE/ST=Niedersachsen/L=Braunschweig/O=HZI/OU=PIA/CN=TESTPIA'
        const dnArr = xCDN ? xCDN.split('/') : [];
        const ouKV = dnArr.find((s) => s.startsWith(CERT_ROLE_PREFIX));
        const OU = ouKV
          ? ouKV.substring(CERT_ROLE_PREFIX.length, ouKV.length)
          : null;

        validCert = !!OU && ouToRole[OU] === role;

        request.log('login', validCert ? 'Valid Cert' : 'Cert for wrong role');
      } else {
        request.log('login', 'Cert is not valid');
      }
    } else {
      request.log('login', 'No Cert used');
    }
  }

  // IP check
  if (config.ipCheckEnabled) {
    checkISEnabled = true;
    let remoteIPs = [request.info.remoteAddress];
    const xFF = request.headers['x-forwarded-for'];

    if (xFF) {
      remoteIPs = remoteIPs.concat(xFF.split(','));
    }

    request.log('login', 'scanning request origin ips for role: ' + role);
    request.log('login', 'Remote IPs: ' + remoteIPs.join(','));
    getRepository(AllowedIp);
    const allowedIPs = await getRepository(AllowedIp).find({
      ip: In(remoteIPs),
      allowedRole: role,
    });

    validIP = allowedIPs.length > 0;
    request.log('login', validIP ? 'Valid IP' : 'No valid IP');
  }

  // The user must have either a valid Cert or a valid IP or no check is performed at all
  return !checkISEnabled || validCert || validIP;
}

function loginFailed(): Boom.Boom {
  return Boom.forbidden('Sorry, Login failed.');
}

function badPassword(request: Request, forThreeTimes: boolean): Boom.Boom {
  if (forThreeTimes) {
    const remainingTime = 300;
    const err = Boom.forbidden('User has 3 failed login attempts', {
      remainingTime: remainingTime,
    });
    err.output.payload['details'] = err.data;
    return err;
  } else {
    request.log('login', 'Incorrect password!');
    return loginFailed();
  }
}

async function doLogin(
  request: Request,
  userData: Account
): Promise<Boom.Boom | LoginResponse> {
  try {
    const loginRequest = request.payload as LoginRequest;

    const username = userData.username;
    const role = userData.role;

    const locale =
      loginRequest.locale && localeHelper.isLocaleSupported(loginRequest.locale)
        ? loginRequest.locale
        : localeHelper.fallbackLocale;

    const token = await JwtService.createAccessToken({
      locale,
      username,
      role,
    });

    const res: LoginResponse = {
      token,
      username,
      role,
      pw_change_needed: userData.pwChangeNeeded,
    };

    if (!request.auth.isAuthenticated) {
      res.token_login = JwtService.createLoginToken({
        username,
      });
    }

    if (role === 'Proband') {
      await messageQueueService.sendProbandLoggedIn(userData.username);
    }

    return res;
  } catch (err) {
    request.log(['login', 'error'], err as Error);
    return Boom.boomify(err as Error);
  }
}

/**
 * logs a user in
 */
export async function login(
  request: Request
): Promise<Boom.Boom | LoginResponse> {
  const loginRequest = request.payload as LoginRequest;
  let username;
  if (request.auth.isAuthenticated) {
    const decodedToken = request.auth.credentials as LoginToken;
    username = decodedToken.username;
    request.log('login', 'Using username from token.');
  } else {
    username = loginRequest.username;
    request.log('login', 'Using username from request.');
  }

  if (!username) {
    return Boom.unauthorized(
      'No username was specified when doing an unauthorized request'
    );
  }

  const accountRepo = getRepository(Account);

  try {
    let userAccount: BasicAccount | undefined = await accountRepo.findOne(
      username
    );
    if (!userAccount) {
      request.log('login', 'Faked user, because user does not exist in DB.');
      userAccount = fakeUserService.get(username);
    }

    username = userAccount.username; // use the spelling and case from db
    const isAllowed =
      userAccount.role === 'Proband' ||
      (await isRequestAllowed(request, userAccount.role));

    // Prevent professional users from logging in when IP is not in allowed list or cert is wrong/missing
    if (!isAllowed) {
      request.log('login', 'Login is not allowed');
      return loginFailed();
    }

    // Calculate time since last wrong login attempt in sec
    const timeSinceLastWrongAttemptSec = userAccount.thirdWrongPasswordAt
      ? Math.floor(
          (Date.now() - userAccount.thirdWrongPasswordAt.getTime()) /
            MILLISECONDS_PER_SECOND
        )
      : null;
    if (
      userAccount.numberOfWrongAttempts === MAX_NUMBER_OF_WRONG_ATTEMPTS &&
      timeSinceLastWrongAttemptSec !== null &&
      timeSinceLastWrongAttemptSec < SECONDS_TO_WAIT
    ) {
      const remainingTime = SECONDS_TO_WAIT - timeSinceLastWrongAttemptSec;
      const err = Boom.forbidden('User has 3 failed login attempts', {
        remainingTime: remainingTime,
      });
      err.output.payload['details'] = err.data;
      return err;
    }

    // check password
    if (userAccount instanceof Account) {
      // Refuse user password if the user did not log in before the initial password validity period passes
      if (userAccount.initialPasswordValidityDate) {
        if (Date.now() > userAccount.initialPasswordValidityDate.getTime()) {
          request.log('login', 'Login is not allowed');
          return loginFailed();
        }
      }
      if (
        userAccount.password ===
        PwHashesHelper.hashThePasswordWithPepper(loginRequest.password)
      ) {
        const updatedPw = PwHashesHelper.createHashedPasswordWithSaltAndPepper(
          loginRequest.password
        );
        userAccount.password = updatedPw.passwordHash;
        userAccount.salt = updatedPw.salt;
        await accountRepo.save(userAccount);
        return doLogin(request, userAccount);
      } else if (
        userAccount.password ===
        PwHashesHelper.hashThePasswordWithSaltAndPepper(
          loginRequest.password,
          userAccount.salt
        )
      ) {
        return doLogin(request, userAccount);
      }
    }

    // handle wrong attempt
    userAccount.numberOfWrongAttempts =
      ((userAccount.numberOfWrongAttempts ?? 0) %
        MAX_NUMBER_OF_WRONG_ATTEMPTS) +
      1;
    userAccount.thirdWrongPasswordAt =
      userAccount.numberOfWrongAttempts === MAX_NUMBER_OF_WRONG_ATTEMPTS
        ? new Date()
        : null;

    if (userAccount instanceof Account) {
      await accountRepo.save(userAccount);
      return badPassword(
        request,
        userAccount.numberOfWrongAttempts === MAX_NUMBER_OF_WRONG_ATTEMPTS
      );
    } else {
      fakeUserService.put(username, userAccount);
      return badPassword(
        request,
        userAccount.numberOfWrongAttempts === MAX_NUMBER_OF_WRONG_ATTEMPTS
      );
    }
  } catch (err) {
    request.log(['login', 'error'], err as Error);
    return Boom.boomify(err as Error);
  }
}

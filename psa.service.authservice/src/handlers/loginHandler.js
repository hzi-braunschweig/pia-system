const Boom = require('@hapi/boom');
const pwHashesHelper = require('../helpers/pwHashesHelper.js');
const pgHelper = require('../services/postgresqlHelper.js');
const fakeUserService = require('../services/fakeUserService.js');
const blockedIPService = require('../services/blockedIPService.js');
const localeHelper = require('../helpers/localeHelper.js');
const jwtService = require('../services/jwtService');

/**
 * @description HAPI Handler for login
 */
const loginHandler = (function () {
  const ouToRole = {
    EinwilligungsManager: 'EinwilligungsManager',
    Untersuchungsteam: 'Untersuchungsteam',
    Probandenmanagement: 'ProbandenManager',
    Forscherteam: 'Forscher',
    Systemadministrator: 'SysAdmin',
  };

  fakeUserService.initService();
  blockedIPService.initService();

  async function isRequestAllowed(request, role) {
    // Only do ip/cert check for production aka https env
    if (process.env.INTERNAL_PORT === '80') {
      return true;
    }

    let validIP = false;
    let validCert = false;
    let checkISEnabled = false;

    // Cert check
    if (process.env.CERT_CHECK_ENABLED === 'true') {
      checkISEnabled = true;
      const xCCU = request.headers['x-client-certificate-used']; // e.g. '1' => true, it is used
      const xCCV = request.headers['x-client-certificate-validated']; // e.g. '0' => valid, no error code

      request.log(
        'login',
        'scanning request headers for valid cert for role:',
        role
      );
      if (xCCU && xCCU === '1') {
        if (xCCV && xCCV === '0') {
          // Do role check
          const xCDN = request.headers['x-ssl-client-dn']; // e.g. '/C=DE/ST=Niedersachsen/L=Braunschweig/O=HZI/OU=PIA/CN=TESTPIA'
          const dnArr = xCDN ? xCDN.split('/') : [];
          const ouKV = dnArr.find((s) => s.substring(0, 3) === 'OU=');
          const OU = ouKV ? ouKV.substring(3, ouKV.length) : null;

          request.log(
            'login',
            OU && ouToRole[OU] === role ? 'Valid Cert' : 'Cert for wrong role'
          );

          validCert = OU && ouToRole[OU] === role;
        } else {
          request.log('login', 'Cert is not valid');
        }
      } else {
        request.log('login', 'No Cert used');
      }
    }

    // IP check
    if (process.env.IP_CHECK_ENABLED === 'true') {
      checkISEnabled = true;
      let remoteIPs = [request.info.remoteAddress];
      const xFF = request.headers['x-forwarded-for'];

      if (xFF) {
        remoteIPs = remoteIPs.concat(xFF.split(','));
      }

      request.log('login', 'scanning request origin ips for role:', role);
      request.log('login', 'Remote IPs:', remoteIPs);

      const allowedIPs = await pgHelper.getAllowedIPs(remoteIPs, role);

      request.log('login', allowedIPs.length > 0 ? 'Valid IP' : 'No valid IP');
      validIP = allowedIPs.length > 0;
    }

    // The user must have either a valid Cert or a valid IP or no check is performed at all
    return !checkISEnabled || validCert || validIP;
  }

  async function doLogin(request, userData) {
    try {
      const userEntry = await pgHelper.updateUserLoginAttemptsAfterLogin(
        request.payload.logged_in_with,
        userData.first_logged_in_at ? userData.first_logged_in_at : new Date(),
        userData.username
      );
      const username = userEntry.username;
      const role = userEntry.role;

      const locale = localeHelper.isLocaleSupported(request.payload.locale)
        ? request.payload.locale
        : localeHelper.fallbackLocale;

      const token = await jwtService.createAccessToken({
        locale,
        app: request.payload.logged_in_with,
        username,
        role,
      });

      const res = {
        token,
        username,
        role,
        compliance_labresults: userEntry.compliance_labresults,
        pw_change_needed: userEntry.pw_change_needed,
        first_logged_in_at: userEntry.first_logged_in_at,
        logged_in_with: userEntry.logged_in_with,
        compliance_samples: userEntry.compliance_samples,
      };

      if (!request.auth.isAuthenticated) {
        res.token_login = jwtService.createLoginToken({
          username,
        });
      }

      return res;
    } catch (err) {
      request.log(['login', 'error'], err);
      return Boom.internal(err);
    }
  }

  function loginFailed() {
    return Boom.forbidden('Sorry, Login failed.');
  }

  function badPassword(request, forThreeTimes) {
    if (forThreeTimes) {
      const remainingTime = 300;
      const err = Boom.forbidden('User has 3 failed login attempts', {
        remainingTime: remainingTime,
      });
      err.output.payload.details = err.data;
      return err;
    } else {
      request.log('login', 'Incorrect password!');
      return loginFailed();
    }
  }

  async function login(request) {
    let username;
    if (request.auth.isAuthenticated) {
      const decodedToken = request.auth.credentials;
      username = decodedToken.username;
      request.log('login', 'Using username from token.');
    } else {
      username = request.payload.username;
      request.log('login', 'Using username from request.');
    }

    try {
      let responseAllUserData = await pgHelper.getUserAllData(username);
      let fakeUser = false;
      if (username && !responseAllUserData) {
        request.log('login', 'Faked user, because user does not exist in DB.');
        responseAllUserData = fakeUserService.get(username);
        fakeUser = true;
      }
      if (responseAllUserData !== undefined && responseAllUserData !== null) {
        username = responseAllUserData.username;
        const isAllowed =
          responseAllUserData.role === 'Proband' ||
          (await isRequestAllowed(request, responseAllUserData.role));

        // Prevent professional users from logging in when IP is not in allowed list or cert is wrong/missing
        if (!isAllowed) {
          request.log('login', 'Login is not allowed');
          return loginFailed();
        }

        // Prevent deleted or deactivated users from logging in
        if (
          responseAllUserData.account_status === 'deactivated' ||
          responseAllUserData.account_status === 'no_account'
        ) {
          request.log('login', 'The account is deactivated');
          return loginFailed();
        }

        // Refuse user password if the user did not log in before the initial password validity period passes
        if (responseAllUserData.initial_password_validity_date) {
          const pwdValidityDate = new Date(
            responseAllUserData.initial_password_validity_date
          );
          if (Date.now() > pwdValidityDate.getTime()) {
            request.log('login', 'Login is not allowed');
            return loginFailed();
          }
        }

        // Calculate time since last wrong login attempt in sec
        const timeSinceLastWrongAttemptSec =
          responseAllUserData.third_wrong_password_at
            ? Math.floor(
                (Date.now() - responseAllUserData.third_wrong_password_at) /
                  1000
              )
            : 360;
        if (
          responseAllUserData.number_of_wrong_attempts <= 3 &&
          timeSinceLastWrongAttemptSec > 300
        ) {
          if (
            !fakeUser &&
            responseAllUserData.password ===
              pwHashesHelper.hashThePasswordWithPepper(request.payload.password)
                .passwordHash
          ) {
            const updatedPw =
              pwHashesHelper.createHashedPasswordWithSaltAndPepper(
                request.payload.password
              );
            await pgHelper.updateUserPasswordOnLogin(
              updatedPw.passwordHash,
              updatedPw.salt,
              username
            );
            return doLogin(request, responseAllUserData);
          } else if (
            !fakeUser &&
            responseAllUserData.password ===
              pwHashesHelper.hashThePasswordWithSaltAndPepper(
                request.payload.password,
                responseAllUserData.salt
              ).passwordHash
          ) {
            return doLogin(request, responseAllUserData);
          } else {
            let number_of_wrong_attempts_new_value;
            let third_wrong_password_at_new_value;
            switch (responseAllUserData.number_of_wrong_attempts) {
              case 3:
                number_of_wrong_attempts_new_value = 1;
                third_wrong_password_at_new_value = null;
                break;
              case 2:
                number_of_wrong_attempts_new_value = 3;
                third_wrong_password_at_new_value = new Date();
                break;
              default:
                number_of_wrong_attempts_new_value =
                  responseAllUserData.number_of_wrong_attempts + 1;
                third_wrong_password_at_new_value = null;
            }

            if (!fakeUser) {
              const response2 = await pgHelper.updateNumberOfWrongLoginAttempts(
                number_of_wrong_attempts_new_value,
                third_wrong_password_at_new_value
                  ? third_wrong_password_at_new_value
                  : responseAllUserData.third_wrong_password_at,
                username
              );
              return badPassword(
                request,
                response2.number_of_wrong_attempts === 3
              );
            } else {
              const fakeUserData = {
                username: username,
                role: 'Proband',
                third_wrong_password_at:
                  third_wrong_password_at_new_value ||
                  responseAllUserData.third_wrong_password_at,
                number_of_wrong_attempts: number_of_wrong_attempts_new_value,
              };
              fakeUserService.put(username, fakeUserData);
              return badPassword(
                request,
                fakeUserData.number_of_wrong_attempts === 3
              );
            }
          }
        } else {
          const remainingTime = 300 - timeSinceLastWrongAttemptSec;
          const err = Boom.forbidden('User has 3 failed login attempts', {
            remainingTime: remainingTime,
          });
          err.output.payload.details = err.data;
          return err;
        }
      } else {
        return Boom.unauthorized(
          'No username was specified when doing an unauthorized request'
        );
      }
    } catch (err) {
      request.log(['login', 'error'], err);
      return Boom.internal(err);
    }
  }

  return {
    /**
     * @function
     * @description logs a user in
     * @memberof module:loginHandler
     */
    login: login,
  };
})();

module.exports = loginHandler;

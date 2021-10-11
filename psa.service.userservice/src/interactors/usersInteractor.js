/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const validator = require('email-validator');
const { runTransaction } = require('../db');

const postgresqlHelper = require('../services/postgresqlHelper');
const mailService = require('../services/mailService');
const mailTemplateService = require('../services/mailTemplateService');
const {
  SecureRandomPasswordService,
} = require('../services/secureRandomPasswordService');
const { generateRandomPseudonym } = require('../helpers/pseudonym-generator');
const sormasserviceClient = require('../clients/sormasserviceClient');
const authserviceClient = require('../clients/authserviceClient');
const personaldataserviceClient = require('../clients/personaldataserviceClient');

const INITIAL_PASSWORD_VALIDITY = 120; // in hours

/**
 * @description interactor that handles user requests based on users permissions
 */
const usersInteractor = (function () {
  function generateInitialPasswordValidityDate() {
    // Set initial password validity period to 120 hours after the user was created
    const initialPasswordValidityDate = new Date();
    initialPasswordValidityDate.setHours(
      initialPasswordValidityDate.getHours() + INITIAL_PASSWORD_VALIDITY
    );
    return initialPasswordValidityDate;
  }

  async function getUser(decodedToken, id, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        return pgHelper.getUserAsProfessional(id, userName).catch((err) => {
          console.log(err);
          throw new Error('Could not get user, because user has no access');
        });
      case 'Proband':
        if (userName === id) {
          return pgHelper.getUser(id).catch((err) => {
            console.log(err);
            throw new Error('Could not get the user: ' + err);
          });
        } else {
          throw new Error('Probands can only get themself');
        }
      default:
        throw new Error('Could not get the user: Unknown or wrong role');
    }
  }

  async function getUserByIDS(ids, requesterUsername) {
    const user = await postgresqlHelper.getUserAsProfessionalByIDS(
      ids,
      requesterUsername
    );
    if (user) {
      return user;
    } else {
      return Boom.notFound(
        "The user with the given IDS does not exist or you don't have the permission"
      );
    }
  }

  async function getUsers(decodedToken, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
        return pgHelper.getUsersForPM(userName).catch((err) => {
          console.log(err);
          throw new Error('Could not get users, because user has no access');
        });
      case 'Untersuchungsteam':
      case 'Forscher':
        return pgHelper.getUsersForProfessional(userName, true).catch((err) => {
          console.log(err);
          throw new Error('Could not get users, because user has no access');
        });
      case 'SysAdmin':
        return pgHelper.getUsersForSysAdmin().catch((err) => {
          console.log(err);
          throw new Error('Could not get users: ' + err);
        });
      default:
        throw new Error('Could not get the user: Unknown or wrong role');
    }
  }

  async function getUsersWithSameRole(decodedToken, pgHelper) {
    const userRole = decodedToken.role;
    const userName = decodedToken.username;

    switch (userRole) {
      case 'ProbandenManager':
      case 'Untersuchungsteam':
      case 'Forscher':
      case 'SysAdmin':
        return pgHelper
          .getUsersWithSameRole(userName, userRole)
          .catch((err) => {
            console.log(err);
            throw new Error('Could not get users, because user has no access');
          });
      default:
        throw new Error('Could not get the user: Unknown or wrong role');
    }
  }

  async function createUser(decodedToken, user, pgHelper) {
    const userRole = decodedToken.role;

    switch (userRole) {
      case 'SysAdmin':
        if (
          (user.role === 'Forscher' ||
            user.role === 'ProbandenManager' ||
            user.role === 'EinwilligungsManager' ||
            user.role === 'Untersuchungsteam') &&
          validator.validate(user.username)
        ) {
          try {
            user.password = SecureRandomPasswordService.generate();

            const result = await authserviceClient.createUser({
              username: user.username,
              role: user.role,
              password: user.password,
              account_status: 'active',
              pw_change_needed: true,
            });

            await mailService.sendMail(
              user.username,
              mailTemplateService.createRegistrationMail(
                user.password,
                user.role
              )
            );

            await pgHelper.insertStudyAccessesWithAccessLevel(
              user.study_accesses,
              user.username
            );

            // send infos back to the ui:
            // but we don't want to send the password!
            result.study_accesses = user.study_accesses;

            return result;
          } catch (err) {
            console.log(err);
            throw new Error('Could not create user: ' + err);
          }
        } else {
          throw new Error(
            'SysAdmin can only create Forscher, ProbandenManager, EinwilligungsManager, Untersuchungsteam with valid email address'
          );
        }
      default:
        throw new Error('Could not create the user: Unknown or wrong role');
    }
  }

  async function createSormasProband(username, data) {
    const requester = await postgresqlHelper.getUser(username);

    // For all studies check, if the requester has access
    for (const study of data.study_accesses) {
      if (
        !requester.study_accesses.some((accessR) => accessR.study_id === study)
      ) {
        return Boom.forbidden('You do not have access to the study: ' + study);
      }
    }

    // Check that ids does not already exist
    if (await postgresqlHelper.isUserExistentByIds(data.uuid)) {
      return Boom.conflict(`The IDS/UUID ${data.uuid} is already in use.`);
    }

    // Create a pseudonym by using prefix and suffix-length defined in the study
    if (data.study_accesses.length !== 1) {
      throw new Error(
        'More than one studies are currently not supported for Sormas'
      );
    }
    const primaryStudy = await postgresqlHelper.getStudy(
      data.study_accesses[0]
    );
    let generatedPseudonym;
    let counter = 0;
    do {
      counter++;
      if (counter > 1000) {
        throw new Error(
          'It seems to be impossible to generate a unused Pseudonym. I tried a thousand times.'
        );
      }
      generatedPseudonym = generateRandomPseudonym(
        primaryStudy.pseudonym_prefix,
        primaryStudy.pseudonym_suffix_length
      );
    } while (
      await postgresqlHelper.isUserExistentByUsername(generatedPseudonym)
    ); // if it exists, create a new one
    data.pseudonym = generatedPseudonym;

    // Create a random password
    const generatedPassword = SecureRandomPasswordService.generate();
    data.password = generatedPassword;

    const user = {
      username: data.pseudonym,
      password: data.password,
      role: 'Proband',
      pw_change_needed: true,
      initial_password_validity_date: generateInitialPasswordValidityDate(),
      account_status: 'active',
    };

    await authserviceClient.createUser(user);

    await runTransaction(async (transaction) => {
      // Store the new proband in db
      await postgresqlHelper.createSormasProband(data, { transaction });

      // Report this to SORMAS
      console.log('Reporting to SORMAS.');
      await sormasserviceClient.setStatus(data.uuid, 'REGISTERED');
    }).catch((e) => {
      console.log(e);
      throw Boom.boomify(e);
    });

    try {
      // Store mail in personalData
      await personaldataserviceClient.updatePersonalData(generatedPseudonym, {
        email: data.email,
      });
      const mailContent =
        mailTemplateService.createSormasRegistrationMail(generatedPassword);
      await mailService.sendMail(data.email, mailContent);

      // The pseudonym is displayed to the PM without the password
      return {
        pseudonym: generatedPseudonym,
        password: null,
      };
    } catch (error) {
      console.warn(error);
      // If the mail could not be sent we display both, the pseudonym and the password to the PM
      return {
        pseudonym: generatedPseudonym,
        password: generatedPassword,
      };
    }
  }

  async function updateUser(decodedToken, userName, userValues, pgHelper) {
    const userRole = decodedToken.role;
    const requester = decodedToken.username;

    switch (userRole) {
      case 'Untersuchungsteam':
        if (
          userValues.is_test_proband !== undefined &&
          userValues.is_test_proband !== null
        ) {
          await pgHelper
            .changeTestProbandState(
              userName,
              userValues.is_test_proband,
              requester
            )
            .catch((err) => {
              console.log(err);
              throw Boom.internal('Could not update user', err);
            });
          return { test_proband_state: userValues.is_test_proband };
        } else {
          throw Boom.badData('payload incorrect');
        }

      case 'ProbandenManager':
        if (
          userValues.account_status !== undefined &&
          userValues.account_status !== null
        ) {
          return await runTransaction(async (transaction) => {
            const updatedProbandStatus = await pgHelper
              .updateProbandStatus(
                userName,
                userValues.account_status,
                requester,
                transaction
              )
              .catch((err) => {
                console.log(err);
                throw new Error('Could not update user');
              });
            if (updatedProbandStatus.account_status === 'deactivated') {
              await personaldataserviceClient.deletePersonalDataOfUser(
                updatedProbandStatus.username
              );
            }
            return updatedProbandStatus;
          });
        } else {
          throw Boom.badData('payload incorrect');
        }
      default:
        throw Boom.forbidden('Wrong role for this command');
    }
  }

  async function deleteUser(decodedToken, username, pgHelper) {
    const userRole = decodedToken.role;

    switch (userRole) {
      case 'SysAdmin':
        try {
          return await pgHelper.deleteUser(username);
        } catch (err) {
          console.log(err);
          return Boom.notFound(err);
        }

      default:
        return Boom.forbidden(
          'Could not delete the user: Unknown or wrong role'
        );
    }
  }

  return {
    /**
     * @function
     * @description gets a user from DB if user is allowed to
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the user to get
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getUser: getUser,

    /**
     * gets a user by ids from DB if requester is allowed to
     * @param ids
     * @param requesterUsername
     * @return {*}
     */
    getUserByIDS: getUserByIDS,

    /**
     * @function
     * @description gets all users from DB the user has access to
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getUsers: getUsers,

    /**
     * @function
     * @description gets all users with the same role as a requester
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    getUsersWithSameRole: getUsersWithSameRole,

    /**
     * @function
     * @description creates the user in DB if it does not exist and the requester is allowed to
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} user the user object to create
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createUser: createUser,

    /**
     * @function
     * @description creates the user in DB if it does not exist and the requester is allowed to
     * @memberof module:usersInteractor
     * @param username
     * @param data {object} the user object to create
     * @return {Promise<{password: string, resultURL: string, pseudonym: *}|*>}
     */
    createSormasProband: createSormasProband,

    /**
     * @function
     * @description updates the user's age and gender in DB
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {object} uservalues the values age and gender to change
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    updateUser: updateUser,

    /**
     * @function
     * @description deletes a user and all its data from DB if user is allowed to
     * @memberof module:usersInteractor
     * @param {object} decodedToken the decoded jwt of the request
     * @param {number} id the id of the user to delete
     * @param {object} pgHelper helper object to query postgres db
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    deleteUser: deleteUser,
  };
})();

module.exports = usersInteractor;

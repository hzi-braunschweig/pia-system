/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const { config } = require('../config');
const postgresqlHelper = require('../services/postgresqlHelper.js');
const RESTPresenter = require('../services/RESTPresenter.js');
const usersInteractor = require('../interactors/usersInteractor.js');
const internalUsersInteractor = require('../interactors/internal/internalUsersInteractor');

/**
 * HAPI Handler for users
 */
class UsersHandler {
  /**
   * get all users the Forscher has access to
   * @param request
   */
  static getAll(request) {
    return usersInteractor
      .getUsers(request.auth.credentials, postgresqlHelper)
      .then((result) => RESTPresenter.presentUsers(result))
      .catch((err) => {
        console.log('Could not get users from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  /**
   * gets all users with the same role as a requester
   * @param request
   */
  static getAllWithSameRole(request) {
    return usersInteractor
      .getUsersWithSameRole(request.auth.credentials, postgresqlHelper)
      .then((result) => RESTPresenter.presentUsers(result))
      .catch((err) => {
        console.log('Could not get users from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  /**
   * gets the user if the Forscher has access
   * @param request
   */
  static getOne(request) {
    const id = request.params.username;

    return usersInteractor
      .getUser(request.auth.credentials, id, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result))
      .catch((err) => {
        console.log('Could not get user: ' + err);
        return Boom.notFound(err);
      });
  }

  static getUserByIDS(request) {
    const requester = request.auth.credentials;

    if (requester && requester.role === 'ProbandenManager') {
      return usersInteractor
        .getUserByIDS(request.params.ids, requester.username)
        .then((result) => RESTPresenter.presentUser(result))
        .catch((err) => Boom.badImplementation(err));
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * creates the user if it does not exist
   * @param request
   */
  static createOne(request) {
    return usersInteractor
      .createUser(request.auth.credentials, request.payload, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result))
      .catch((err) => {
        console.log('Could not create user in DB: ' + err);
        return Boom.conflict(err);
      });
  }

  /**
   * creates the proband if it does not exist
   * @param request
   */
  static createProband(request) {
    let requester;
    if (request.auth.isAuthenticated) {
      requester = request.auth.credentials.username;
    } else {
      requester = request.payload.ut_email;
    }

    if (
      request.auth.isAuthenticated ||
      (request.payload.apiKey === config.apiKey && requester)
    ) {
      return usersInteractor
        .createProband(requester, request.payload, postgresqlHelper)
        .then((result) => {
          if (result instanceof Error) {
            result.output.payload = result.data;
          }
          return result;
        });
    } else {
      return Boom.forbidden('invalid authentication');
    }
  }

  /**
   * creates the sormas proband if it does not exist
   * @param request
   * @return {*}
   */
  static createSormasProband(request) {
    const requester = request.auth.credentials;

    if (requester && requester.role === 'ProbandenManager') {
      return usersInteractor
        .createSormasProband(requester.username, request.payload)
        .catch((err) => Boom.badImplementation(err));
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  }

  /**
   * creates the ids proband if it does not exist
   * @param request
   */
  static createIDSProband(request) {
    return usersInteractor
      .createIDSProband(
        request.auth.credentials,
        request.payload,
        postgresqlHelper
      )
      .catch((err) => {
        console.log('Could not create IDS in DB: ' + err);
        return Boom.conflict(err);
      });
  }

  /**
   * creates the user if it does not exist
   * @param request
   */
  static updateOne(request) {
    const username = request.params.username;
    const uservalues = request.payload;

    return usersInteractor.updateUser(
      request.auth.credentials,
      username,
      uservalues,
      postgresqlHelper
    );
  }

  /**
   * deletes the user and all its data if the user is allowed to
   * @param request
   */
  static deleteOne(request) {
    const id = request.params.username;

    return usersInteractor
      .deleteUser(request.auth.credentials, id, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result))
      .catch((err) => {
        console.log('Could not delete user from DB: ' + err);
        return Boom.notFound(err);
      });
  }

  /**
   * get a mobile version
   */
  static getMobileVersion() {
    return usersInteractor
      .getMobileVersion(postgresqlHelper)
      .then((result) => RESTPresenter.presentMobileVersion(result))
      .catch((err) => {
        console.log('Could not get version: ' + err);
        return Boom.internal(err);
      });
  }

  /**
   * get user external compliance - this is an internal method used in S2S Api call
   */
  static async getUserExternalCompliance(request) {
    try {
      const externalCompliance =
        await internalUsersInteractor.getUserExternalCompliance(
          request.params.username,
          postgresqlHelper
        );
      if (externalCompliance) {
        return externalCompliance;
      } else {
        return Boom.notFound('no user found');
      }
    } catch (err) {
      request.log(
        ['error'],
        'Could not get an answer from database for external compliance'
      );
      request.log(['error'], err);
      return Boom.serverUnavailable(err);
    }
  }
}

module.exports = UsersHandler;

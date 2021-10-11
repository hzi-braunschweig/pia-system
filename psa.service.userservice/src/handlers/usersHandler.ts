/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import Boom from '@hapi/boom';
import postgresqlHelper from '../services/postgresqlHelper';
import RESTPresenter from '../services/RESTPresenter';
import usersInteractor from '../interactors/usersInteractor';
import { AccessToken } from '@pia/lib-service-core';

/**
 * HAPI Handler for users
 */
export class UsersHandler {
  /**
   * get all users the Forscher has access to
   * @param request
   */
  public static getAll: Lifecycle.Method = async (request) => {
    return usersInteractor
      .getUsers(request.auth.credentials, postgresqlHelper)
      .then((result) => RESTPresenter.presentUsers(result))
      .catch((err) => {
        console.log('Could not get users from DB:', err);
        return Boom.notFound(err);
      });
  };

  /**
   * gets all users with the same role as a requester
   * @param request
   */
  public static getAllWithSameRole: Lifecycle.Method = async (request) => {
    return usersInteractor
      .getUsersWithSameRole(request.auth.credentials, postgresqlHelper)
      .then((result) => RESTPresenter.presentUsers(result) as unknown)
      .catch((err) => {
        console.log('Could not get users from DB:', err);
        return Boom.notFound(err);
      });
  };

  /**
   * gets the user if the Forscher has access
   * @param request
   */
  public static getOne: Lifecycle.Method = async (request) => {
    const id = request.params['username'] as string;

    return usersInteractor
      .getUser(request.auth.credentials, id, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch((err) => {
        console.log('Could not get user:', err);
        return Boom.notFound(err);
      });
  };

  public static getUserByIDS: Lifecycle.Method = (request) => {
    const token = request.auth.credentials as AccessToken;
    const ids = request.params['ids'] as string;

    if (token.role === 'ProbandenManager') {
      return usersInteractor
        .getUserByIDS(ids, token.username)
        .then((result) => RESTPresenter.presentUser(result) as unknown)
        .catch((err) => Boom.badImplementation(err));
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  };

  /**
   * creates the user if it does not exist
   * @param request
   */
  public static createOne: Lifecycle.Method = async (request) => {
    return usersInteractor
      .createUser(request.auth.credentials, request.payload, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch((err) => {
        console.log('Could not create user in DB:', err);
        return Boom.conflict(err);
      });
  };

  /**
   * creates the sormas proband if it does not exist
   * @param request
   * @return {*}
   */
  public static createSormasProband: Lifecycle.Method = (request) => {
    const requester = request.auth.credentials as AccessToken;

    if (requester.role === 'ProbandenManager') {
      return usersInteractor
        .createSormasProband(requester.username, request.payload)
        .catch((err) => Boom.badImplementation(err));
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  };

  /**
   * creates the user if it does not exist
   * @param request
   */
  public static updateOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['username'] as string;
    const uservalues = request.payload;

    return usersInteractor.updateUser(
      request.auth.credentials,
      pseudonym,
      uservalues,
      postgresqlHelper
    );
  };

  /**
   * deletes the user and all its data if the user is allowed to
   * @param request
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['username'] as string;

    return usersInteractor
      .deleteUser(request.auth.credentials, pseudonym, postgresqlHelper)
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch((err) => {
        console.log('Could not delete user from DB:', err);
        return Boom.notFound(err);
      });
  };
}

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Lifecycle } from '@hapi/hapi';

import Boom from '@hapi/boom';
import RESTPresenter from '../services/RESTPresenter';
import { UsersInteractor } from '../interactors/usersInteractor';
import { AccessToken } from '@pia/lib-service-core';
import { AccountStatus, CreateUserRequest } from '../models/user';

function handleError(error: unknown): void {
  if (error instanceof Boom.Boom) {
    throw error;
  }
  console.error(error);
  throw Boom.badImplementation('An internal Error happened');
}

/**
 * HAPI Handler for users
 */
export class UsersHandler {
  /**
   * get all users the Forscher has access to
   * @param request
   */
  public static getAll: Lifecycle.Method = async (request) => {
    return UsersInteractor.getUsers(request.auth.credentials as AccessToken)
      .then((result) => RESTPresenter.presentUsers(result))
      .catch(handleError);
  };

  /**
   * gets all users with the same role as a requester
   * @param request
   */
  public static getAllWithSameRole: Lifecycle.Method = async (request) => {
    return UsersInteractor.getUsersWithSameRole(
      request.auth.credentials as AccessToken
    )
      .then((result) => RESTPresenter.presentUsers(result) as unknown)
      .catch(handleError);
  };

  /**
   * gets the user if the Forscher has access
   * @param request
   */
  public static getOne: Lifecycle.Method = async (request) => {
    const id = request.params['username'] as string;

    return UsersInteractor.getUser(request.auth.credentials as AccessToken, id)
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch(handleError);
  };

  public static getUserByIDS: Lifecycle.Method = (request) => {
    const token = request.auth.credentials as AccessToken;
    const ids = request.params['ids'] as string;

    if (token.role === 'ProbandenManager') {
      return UsersInteractor.getUserByIDS(ids, token.username)
        .then((result) => RESTPresenter.presentUser(result) as unknown)
        .catch(handleError);
    } else {
      return Boom.forbidden('Wrong role for this command');
    }
  };

  /**
   * creates the user if it does not exist
   * @param request
   */
  public static createOne: Lifecycle.Method = async (request) => {
    return UsersInteractor.createUser(
      request.auth.credentials as AccessToken,
      request.payload as CreateUserRequest
    )
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch(handleError);
  };

  /**
   * creates the sormas proband if it does not exist
   * @param request
   * @return {*}
   */
  public static createSormasProband: Lifecycle.Method = (request) => {
    const requester = request.auth.credentials as AccessToken;

    if (requester.role === 'ProbandenManager') {
      return UsersInteractor.createSormasProband(
        requester.username,
        request.payload
      ).catch((err) => Boom.badImplementation(err));
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

    return UsersInteractor.updateUser(
      request.auth.credentials as AccessToken,
      pseudonym,
      uservalues as {
        is_test_proband?: boolean;
        account_status?: AccountStatus;
      }
    ).catch(handleError);
  };

  /**
   * deletes the user and all its data if the user is allowed to
   * @param request
   */
  public static deleteOne: Lifecycle.Method = async (request) => {
    const pseudonym = request.params['username'] as string;

    return UsersInteractor.deleteUser(
      request.auth.credentials as AccessToken,
      pseudonym
    )
      .then((result) => RESTPresenter.presentUser(result) as unknown)
      .catch(handleError);
  };
}
